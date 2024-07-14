import { Request, Response } from "express"
import { AdditionalApiContext } from "../main.js"
import {
    dbLogger,
    getIntegerParam, getRepositoryParameter, getStringParam,
    HttpClientErrors,
    HttpSuccessCodes, isParameterError,
    lionwebResponse, ParameterError,
    RepositoryData
} from "@lionweb/repository-common"
import {BulkImport} from "../proto/Chunk.js";
import {ImportData} from "../database/index.js";
import {LionWebJsonMetaPointer, LionWebJsonNode} from "@lionweb/validation";

export interface AdditionalApi {
    getNodeTree(request: Request, response: Response): void
    bulkImport(request: Request, response: Response): void
}

export class AdditionalApiImpl implements AdditionalApi {
    constructor(private context: AdditionalApiContext) {
    }
    /**
     * Get the tree with root `id`, for a list of node ids.
     * Note that the tree could be overlapping, and the same nodes could appear multiple times in the response.
     * @param request
     * @param response
     */
    getNodeTree = async (request: Request, response: Response): Promise<void> => {
        const idList = request.body.ids
        if (idList === undefined) {
            lionwebResponse(response, HttpClientErrors.BadRequest, {
                success: false,
                messages: [{
                    kind: "EmptyIdList",
                    message: "ids not found",
                    data: idList
                }]
            })
            return
        }
        const clientId = getStringParam(request, "clientId", "Dummy")
        if (isParameterError(clientId)) {
            lionwebResponse(response, HttpClientErrors.BadRequest, {
                success: false,
                messages: [(clientId as ParameterError).error]
            })
            return
        }
        const repositoryData: RepositoryData = { clientId: clientId, repository: getRepositoryParameter(request) }
        const depthLimit = getIntegerParam(request, "depthLimit", Number.MAX_SAFE_INTEGER)
        if (isParameterError(depthLimit)) {
            lionwebResponse(response, HttpClientErrors.PreconditionFailed, {
                success: false,
                messages: [depthLimit.error]
            })
        } else {
            dbLogger.info("API.getNodeTree is " + idList)
            const result = await this.context.additionalApiWorker.getNodeTree(repositoryData, idList, depthLimit)
            lionwebResponse(response, HttpSuccessCodes.Ok, {
                success: true,
                messages: [],
                data: result.queryResult
            })
        }
    }

    bulkImport = async (request: Request, response: Response): Promise<void> => {
        const clientId = getStringParam(request, "clientId", "Dummy")
        if (isParameterError(clientId)) {
            lionwebResponse(response, HttpClientErrors.BadRequest, {
                success: false,
                messages: [(clientId as ParameterError).error]
            })
            return
        }
        const repositoryData: RepositoryData = { clientId: clientId, repository: getRepositoryParameter(request) }
        console.log(`bulkImport CONTENT TYPE ${request.headers["content-type"]}`)
        console.log(`bulkImport headers ${JSON.stringify(request.headers)}`)
        if (request.is('application/json')) {
            console.log("JSON RECOGNIZED")
            const result = await this.context.additionalApiWorker.bulkImport(repositoryData, request.body)
            lionwebResponse(response, HttpSuccessCodes.Ok, {
                success: result.success,
                messages: [],
                data: []
            })
        } else if (request.is("application/protobuf")) {
            console.log("PROTOBUF RECOGNIZED")
            console.log(`BODY ${request.body.constructor.name}`)
            console.log(`BODY LENGTH ${request.body.length}`)
            const data = new Uint8Array(request.body.buffer, request.body.byteOffset, request.body.byteLength)
            const bulkImport = BulkImport.decode(data)
            const imports : ImportData[] = []
            const metaPointersMap = new Map<number, LionWebJsonMetaPointer>()
            bulkImport.metaPointerDefs.forEach(mpd => {
                console.log(`Storing index ${mpd.index}`)
                metaPointersMap.set(mpd.index, mpd)
            })

            const findMetaPointer = (metaPointerIndex: number) : LionWebJsonMetaPointer => {
                const res = metaPointersMap.get(metaPointerIndex)
                if (res == null) {
                    throw new Error(`Metapointer with index ${metaPointerIndex} not found. Metapointer index known: ${metaPointersMap.keys()}`)
                }
                return res;
            }

            bulkImport.elements.forEach(el => {
                const metaPointer = findMetaPointer(el.metaPointerIndex);
                const nodes : LionWebJsonNode[] = [];
                el.tree.forEach(n => {
                    nodes.push({
                     id: n.id,
                     parent: n.parent,
                     classifier: n.classifier,
                     annotations: [],
                     properties: n.properties.map(p => {
                         return {
                             property: findMetaPointer(p.metaPointerIndex),
                             value: p.value
                         }
                     }),
                     containments: n.containments.map(c => {
                         return {
                             containment: findMetaPointer(c.metaPointerIndex),
                             children: c.children
                         }
                     }),
                     references:  n.references.map(r => {
                         return {
                             reference: findMetaPointer(r.metaPointerIndex),
                             targets: r.values.map(rv => {
                                 return {
                                     reference: rv.referred,
                                     resolveInfo: rv.resolveInfo
                                 }
                             })
                         }
                     }),
                    })
                });
                imports.push({
                    containmentKey: {
                        nodeId: el.container,
                        containment: metaPointer
                    },
                    treeData: {
                        serializationFormatVersion: "",
                        languages: [],
                        nodes
                    }
                })
                // const import = {
                //   containmentKey: {
                //       nodeId: el.container,
                //       containment: metaPointer
                //   }
                // };
            //     const import : ImportData = {
            //         containmentKey: {
            //             nodeId: el.container,
            //             containment: metaPointer
            //         },
            //         treeData: {
            //             languages: [],
            //             serializationFormatVersion: "",
            //             nodes: el.tree.map(n => {
            //
            //             })
            //         }
            //     }
            });
            const result = await this.context.additionalApiWorker.bulkImport(repositoryData, imports)
            lionwebResponse(response, HttpSuccessCodes.Ok, {
                success: result.success,
                messages: [],
                data: []
            })
        } else {
            throw new Error("TYPE NOT RECOGNIZED")
        }

    }
}

// function toArrayBuffer(buffer: Buffer): ArrayBuffer {
//     const arrayBuffer = new ArrayBuffer(buffer.length);
//     const view = new Uint8Array(arrayBuffer);
//     for (let i = 0; i < buffer.length; ++i) {
//         view[i] = buffer[i];
//     }
//     return arrayBuffer;
// }
