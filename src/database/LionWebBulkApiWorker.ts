import { LionWebJsonChunk, LionWebJsonNode, LwJsonUsedLanguage } from "@lionweb/validation"
import { LIONWEB_QUERIES } from "./LionWebQueries.js"
import { collectUsedLanguages } from "./UsedLanguages.js"

/**
 * Implementations of the LionWebBulkApi methods.
 */
class LionWebBulkApiWorker {
    // private lionwebDb2: LionWebQueries ;

    constructor() {
        // this.lionwebDb2 = LIONWEB_QUERIES ;
    }

    async bulkPartitions(): Promise<LionWebJsonChunk> {
        const result = await LIONWEB_QUERIES.getPartitions()
        // console.log("LionWebBulkApiWorker.bulkPartitions.Result: " + JSON.stringify(result));
        return result
    }

    async bulkStore(chunk: LionWebJsonChunk) {
        // return await LIONWEB_QUERIES.store(chunk.nodes);
        return await LIONWEB_QUERIES.store(chunk)
    }

    /**
     * This implementation uses Postgres for querying
     * @param nodeIdList
     * @param mode
     * @param depthLimit
     */
    async bulkRetrieve(nodeIdList: string[], mode: string, depthLimit: number): Promise<LionWebJsonChunk> {
        if (nodeIdList.length === 0) {
            return {
                serializationFormatVersion: "2023.1",
                languages: [],
                nodes: [],
            }
        }
        const allNodes = await LIONWEB_QUERIES.getNodeTree(nodeIdList, depthLimit)
        console.log("LionWebBulkApiWorker.bulkRetrieve: all " + JSON.stringify(allNodes))
        if (allNodes.length === 0) {
            return {
                serializationFormatVersion: "2023.1",
                languages: [],
                nodes: [],
            }
        }
        const nodes = await LIONWEB_QUERIES.getNodesFromIdList(allNodes.map(node => node.id))
        const usedLanguages: LwJsonUsedLanguage[] = collectUsedLanguages(nodes)
        return {
            serializationFormatVersion: "2023.1",
            languages: usedLanguages,
            nodes: nodes,
        }
    }
}

export const LIONWEB_BULKAPI_WORKER = new LionWebBulkApiWorker()
