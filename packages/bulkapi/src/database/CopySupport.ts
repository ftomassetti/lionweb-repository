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
                    read_stream_string.push("\\N");
                } else {
                    read_stream_string.push(prop.value
                        .replaceAll('\n', '\\n')
                        .replaceAll('\t', '\\t'));
                    //read_stream_string.push(JSON.stringify(prop.value));
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

function prepareInputStreamReferences(nodes: LionWebJsonNode[]) : Duplex {
    const separator = "\t";
    const read_stream_string = new Duplex();
    nodes.forEach(node => {
        if (node.id == 'file--Users-federico-repos-EGL-AlgemmeenBN-egl-BNDataApplicaties-EGLSource-nl-apg-bnabnvw081-programs-BN081WA-egl_eglProgram_variables_6_type_name') {
            console.log(`references for node of interest: ${JSON.stringify(node.references)}`)
        }
        node.references.forEach(ref => {
            try {
                read_stream_string.push(ref.reference.language);
                read_stream_string.push(separator);
                read_stream_string.push(ref.reference.version);
                read_stream_string.push(separator);
                read_stream_string.push(ref.reference.key);
                read_stream_string.push(separator);

                // {"{\\"reference\\": \\"int\\", \\"resolveInfo\\": \\"int\\"}"

                const refValueStr = "{" + ref.targets.map(t => {
                    let refStr = "null";
                    if (t.reference != null) {
                        refStr = `\\\\"${t.reference}\\\\"`
                    }

                    return `"{\\\\"reference\\\\": ${refStr}, \\\\"resolveInfo\\\\": \\\\"${t.resolveInfo}\\\\"}"`
                }).join(",") + "}";
                if (node.id == 'file--Users-federico-repos-EGL-AlgemmeenBN-egl-BNDataApplicaties-EGLSource-nl-apg-bnabnvw081-programs-BN081WA-egl_eglProgram_variables_6_type_name') {
                    console.log(`refValueStr for ${ref.reference.key}: ${refValueStr}`)
                }
                read_stream_string.push(refValueStr);
                read_stream_string.push(separator);
                read_stream_string.push(node.id);
                read_stream_string.push("\n");
            } catch (e) {
                throw Error(`ERROR WHEN POPULATING REFERENCES STREAM ${e}`)
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
                read_stream_string.push("{" + containment.children.join(",") + "}");
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
    console.log("CALL TO STORE NODES")
    let n = nodes.find((n)=> n.id == "file--Users-federico-repos-EGL-AlgemmeenBN-egl-BNDataApplicaties-EGLSource-nl-apg-bnabnvw081-programs-BN081WA-egl_eglProgram_variables_6_type_name");
    if (n == null) {
        console.log("node not found")
    } else {
        console.log(`n references ${JSON.stringify(n.references)}`);
    }
    await new Promise<void>((resolve, reject) => {
        try {
            const queryStream = client.query(copyFrom('COPY "repository:default".lionweb_nodes FROM STDIN'))
            const inputStream = prepareInputStreamNodes(nodes);

            inputStream.on('error', (err: Error) => {
                console.error(`FAILURE 3 ${err}`)
                reject(`Input stream error storeNodes : ${err}`)
            });

            queryStream.on('error', (err: Error) => {
                console.error(`FAILURE 2 ${err}`)
                reject(`Query stream error storeNodes: ${err}`)

            });

            queryStream.on('end', () => {
                resolve();
            });

            inputStream.on('end', () => {
                resolve();
            });

            inputStream.pipe(queryStream);
        } catch (e) {
            console.error(`FAILURE 1 ${e}`)
            reject(`Error storeNodes error storeNodes: ${e}`)
        }
    });
    n = nodes.find((n)=> n.id == "file--Users-federico-repos-EGL-AlgemmeenBN-egl-BNDataApplicaties-EGLSource-nl-apg-bnabnvw081-programs-BN081WA-egl_eglProgram_variables_6_type_name");
    if (n == null) {
        console.log("node2 not found")
    } else {
        console.log(`n2 references ${JSON.stringify(n.references)}`);
    }
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
    n = nodes.find((n)=> n.id == "file--Users-federico-repos-EGL-AlgemmeenBN-egl-BNDataApplicaties-EGLSource-nl-apg-bnabnvw081-programs-BN081WA-egl_eglProgram_variables_6_type_name");
    if (n == null) {
        console.log("node3 not found")
    } else {
        console.log(`n3 references ${JSON.stringify(n.references)}`);
    }
    await new Promise<void>((resolve, reject) => {
        const queryStream = client.query(copyFrom('COPY "repository:default".lionweb_references(reference_language,reference_version,reference_key,targets,node_id) FROM STDIN'))
        const inputStream = prepareInputStreamReferences(nodes);

        inputStream.on('error', (err: Error) => {
            reject(`Input stream error references : ${err}`)
        });

        queryStream.on('error', (err: Error) => {
            reject(`Query stream error references: ${err}`)

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

}
