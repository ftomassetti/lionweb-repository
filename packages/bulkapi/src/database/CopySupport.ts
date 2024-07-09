import {LionWebJsonNode} from "@lionweb/validation";
import {Duplex} from "stream";
import {PoolClient} from "pg";
import {from as copyFrom} from "pg-copy-streams";

function prepareInputStream(nodes: LionWebJsonNode[]) : Duplex {
    const separator = "\t";
    const read_stream_string = new Duplex();
    nodes.forEach(node => {
        read_stream_string.push(node.id);
        read_stream_string.push(separator);
        read_stream_string.push(node.classifier.language);
        read_stream_string.push(separator);
        read_stream_string.push(node.classifier.version);
        read_stream_string.push(separator);
        read_stream_string.push(node.classifier.key);
        read_stream_string.push(separator);
        read_stream_string.push("{}");
        read_stream_string.push(separator);
        read_stream_string.push(node.parent);
        read_stream_string.push("\n");
    })
    read_stream_string.push(null);
    return read_stream_string;
}

export async function storeNodes(client: PoolClient, nodes: LionWebJsonNode[]) : Promise<void> {
    return new Promise((resolve, reject) => {
        const queryStream = client.query(copyFrom('COPY "repository:default".lionweb_nodes FROM STDIN'))
        const inputStream = prepareInputStream(nodes);

        inputStream.on('error', (err) => {
            reject(`Input stream error: ${err}`)
        });

        queryStream.on('error', (err) => {
            reject(`Query stream error: ${err}`)

        });

        queryStream.on('end', () => {
            resolve();
        });

        inputStream.on('end', () => {
            resolve();
        });

        inputStream.pipe(queryStream);
    });
}