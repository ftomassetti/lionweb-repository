import {LionWebJsonNode} from "@lionweb/validation";
import {Duplex} from "stream";
import {PoolClient} from "pg";
import {from as copyFrom} from "pg-copy-streams";

function prepareInputStreamNodes(nodes: LionWebJsonNode[]) : Duplex {
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

function prepareInputStreamProperties(nodes: LionWebJsonNode[]) : Duplex {
    const separator = "\t";
    const read_stream_string = new Duplex();
    nodes.forEach(node => {
        node.properties.forEach(prop => {
            try {
                read_stream_string.push(prop.property.language);
                read_stream_string.push(separator);
                read_stream_string.push(prop.property.version);
                read_stream_string.push(separator);
                read_stream_string.push(prop.property.key);
                read_stream_string.push(separator);
                if (prop.value == null) {
                    read_stream_string.push("NULL");
                } else {
                    read_stream_string.push("\"" + prop.value + "\"");
                }
                read_stream_string.push(separator);
                read_stream_string.push(node.id);
                read_stream_string.push("\n");
            } catch (e) {
                throw Error(`ERROR WHEN POPULATING PROPERTIES STREAM ${e}`)
            }
        });
    })
    try {
        read_stream_string.push(null);
    }catch (e) {
        throw Error(`ERROR WHEN Setting the null ${e}`)
    }
    return read_stream_string;
}

function prepareInputStreamContainments(nodes: LionWebJsonNode[]) : Duplex {
    const separator = "\t";
    const read_stream_string = new Duplex();
    nodes.forEach(node => {
        node.containments.forEach(containment => {
            try {
                read_stream_string.push(containment.containment.language);
                read_stream_string.push(separator);
                read_stream_string.push(containment.containment.version);
                read_stream_string.push(separator);
                read_stream_string.push(containment.containment.key);
                read_stream_string.push(separator);
                read_stream_string.push("[" + containment.children.map(e => "\"" + e + "\"").join(",") + "]");
                read_stream_string.push(separator);
                read_stream_string.push(node.id);
                read_stream_string.push("\n");
            } catch (e) {
                throw Error(`ERROR WHEN POPULATING PROPERTIES STREAM ${e}`)
            }
        });
    })
    try {
        read_stream_string.push(null);
    }catch (e) {
        throw Error(`ERROR WHEN Setting the null ${e}`)
    }
    return read_stream_string;
}

export async function storeNodes(client: PoolClient, nodes: LionWebJsonNode[]) : Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const queryStream = client.query(copyFrom('COPY "repository:default".lionweb_nodes FROM STDIN'))
        const inputStream = prepareInputStreamNodes(nodes);

        inputStream.on('error', (err: Error) => {
            reject(`Input stream error storeNodes : ${err}`)
        });

        queryStream.on('error', (err: Error) => {
            reject(`Query stream error storeNodes: ${err}`)

        });

        queryStream.on('end', () => {
            resolve();
        });

        inputStream.on('end', () => {
            resolve();
        });

        inputStream.pipe(queryStream);
    });
    await new Promise<void>((resolve, reject) => {
        const queryStream = client.query(copyFrom('COPY "repository:default".lionweb_containments(containment_language,containment_version,containment_key,children,node_id) FROM STDIN'))
        const inputStream = prepareInputStreamContainments(nodes);

        inputStream.on('error', (err: Error) => {
            reject(`Input stream error storeNodes : ${err}`)
        });

        queryStream.on('error', (err: Error) => {
            reject(`Query stream error containments: ${err}`)

        });

        queryStream.on('end', () => {
            resolve();
        });

        inputStream.on('end', () => {
            resolve();
        });

        inputStream.pipe(queryStream);
    });
    new Promise<void>((resolve, reject) => {
        const queryStream = client.query(copyFrom('COPY "repository:default".lionweb_properties(property_language,property_version,property_key,value,node_id) FROM STDIN'))
        const inputStream = prepareInputStreamProperties(nodes);

        inputStream.on('error', (err: Error) => {
            reject(`Input stream error prepareInputStreamProperties: ${err}`)
        });

        queryStream.on('error', (err: Error) => {
            reject(`Query stream error prepareInputStreamProperties: ${err}`)

        });

        queryStream.on('end', () => {
            resolve();
        });

        inputStream.on('end', () => {
            resolve();
        });

        inputStream.pipe(queryStream);
    });
    // TODO consider references
}
