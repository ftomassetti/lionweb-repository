import {
    ChunkUtils,
    isEqualMetaPointer,
    JsonContext,
    LionWebJsonChild as LionWebJsonContainment,
    LionWebJsonChunk,
    LionWebJsonNode,
    LionWebJsonProperty,
    LionWebJsonReference,
    LwJsonUsedLanguage,
    NodeUtils
} from "@lionweb/validation"
import { Change, GenericChange } from "./Change.js"
import { LanguageAdded, LanguageRemoved, NodeAdded, NodeRemoved, SerializationFormatChange } from "./ChunkChange.js"
import { ChildAdded, ChildRemoved, ContainmentAdded, ContainmentRemoved } from "./ContainmentChange.js"
import { DiffResult } from "./DiffResult.js"
import { NodeClassifierChanged, ParentChanged } from "./NodeChange.js";
import { PropertyAdded, PropertyRemoved, PropertyValueChanged } from "./PropertyChange.js"

export class LionWebJsonDiff {
    diffsAsString: string[] = []
    diffResult = new DiffResult()

    constructor() {
    }

    change(change: Change): void {
        this.diffsAsString.push(change.changeMsg() + "\n")
        this.diffResult.change(change)
    }

    diff(ctx: JsonContext, msg: string) {
        const change = new GenericChange(ctx, msg)
        this.diffsAsString.push("!!!" + change.changeMsg() + "\n")
        this.diffResult.change(change)
    }

    /**
     * Compare two LwNode objects and return their difference
     * @param beforeNode
     * @param afterNode
     */
    diffLwNode(ctx: JsonContext, beforeNode: LionWebJsonNode, afterNode: LionWebJsonNode): void {
        if (!isEqualMetaPointer(beforeNode.classifier, afterNode.classifier)) {
            this.change(new NodeClassifierChanged(ctx.concat("classifier"), beforeNode, beforeNode.classifier.key, afterNode.classifier.key))
        }
        if (beforeNode.parent !== afterNode.parent) {
            this.change(new ParentChanged(ctx, beforeNode, beforeNode.parent, afterNode.parent))
        }
        // Find diff between previous and next properties
        beforeNode.properties.forEach((beforeProperty: LionWebJsonProperty, index: number) => {
            const key = beforeProperty.property.key
            const afterProperty = NodeUtils.findLwProperty(afterNode, key)
            if (afterProperty === null) {
                this.change(new PropertyRemoved(ctx.concat("properties", index), beforeNode.id, beforeProperty.property.key, beforeProperty.value, undefined))
            } else {
                this.diffLwProperty(ctx.concat("properties", index), beforeNode, beforeProperty, afterProperty)
            }
        })       
        afterNode.properties.forEach((afterProperty: LionWebJsonProperty, index: number) => {
            const key = afterProperty.property.key
            const beforeProperty = NodeUtils.findLwProperty(beforeNode, key)
            if (beforeProperty === null) {
                this.change(new PropertyAdded(ctx.concat("properties", index), beforeNode.id, afterProperty.property.key, undefined, afterProperty.value))
            }
            // no else, if the property exists in both nodes, the diff has been claculated in the loop before this one
        })
        beforeNode.containments.forEach((beforeContainment: LionWebJsonContainment, index: number) => {
            const beforeKey = beforeContainment.containment.key
            const afterContainment = NodeUtils.findLwChild(afterNode, beforeKey)
            if (afterContainment === null) {
                this.change(new ContainmentRemoved(ctx.concat("containments", index), beforeNode, beforeContainment))
            } else {
                this.diffContainment(ctx.concat("containments", index), beforeNode, beforeContainment, afterContainment)
            }
        })
        afterNode.containments.forEach((afterContainment: LionWebJsonContainment, index: number) => {
            const afterKey = afterContainment.containment.key
            const beforeContainment = NodeUtils.findLwChild(beforeNode, afterKey)
            if (beforeContainment === null) {
                this.change(new ContainmentAdded(ctx.concat("containments", index), afterNode, afterContainment))
            }
            // No else, has already be done
        })
        beforeNode.references.forEach((reference: LionWebJsonReference, index: number) => {
            const key = reference.reference.key
            const otherref = NodeUtils.findLwReference(afterNode, key)
            if (otherref === null) {
                this.diff(ctx, `Reference with key ${key} does not exist in second object`)
            } else {
                this.diffLwReference(ctx.concat("references", index), reference, otherref)
            }
        })
    }

    diffLwChunk(beforeChunk: LionWebJsonChunk, afterChunk: LionWebJsonChunk): void {
        const ctx = new JsonContext(null, ["$"])
        console.log("Comparing chunks")
        if (beforeChunk.serializationFormatVersion !== afterChunk.serializationFormatVersion) {
            this.change( new SerializationFormatChange(ctx.concat("serializationFormatVersion"), beforeChunk.serializationFormatVersion, afterChunk.serializationFormatVersion))
        }
        beforeChunk.languages.forEach((beforeLanguage: LwJsonUsedLanguage, index: number) => {
            const afterLanguage = ChunkUtils.findLwUsedLanguage(afterChunk, beforeLanguage.key)
            if (afterLanguage === null) {
                this.change(new LanguageRemoved(ctx.concat("languages", index), beforeLanguage))
            } else {
                this.diffLwUsedLanguage(ctx.concat("languages", index), beforeLanguage, afterLanguage)
            }
        })
        afterChunk.languages.forEach((afterLanguage: LwJsonUsedLanguage, index: number) => {
            const beforeLanguage = ChunkUtils.findLwUsedLanguage(beforeChunk, afterLanguage.key)
            if (beforeLanguage === null) {
                this.change(new LanguageAdded(ctx.concat("languages", index), afterLanguage))
            }
        })
        beforeChunk.nodes.forEach((beforeNode: LionWebJsonNode, index: number) => {
            const beforeId = beforeNode.id
            const afterNode = ChunkUtils.findNode(afterChunk, beforeId)
            const newCtx = ctx.concat("nodes", index)
            if (afterNode === null || afterNode === undefined) {
                this.change(new NodeRemoved(ctx, beforeNode))
            } else {
                this.diffLwNode(newCtx, beforeNode, afterNode)
            }
        })
        afterChunk.nodes.forEach((afterNode: LionWebJsonNode, index: number) => {
            const afterId = afterNode.id
            const beforeNode = ChunkUtils.findNode(beforeChunk, afterId)
            if (beforeNode === null) {
                this.change(new NodeAdded(ctx.concat("nodes", index), afterNode))
            }
        })
    }

    diffContainment(ctx: JsonContext, node: LionWebJsonNode, beforeContainment: LionWebJsonContainment, afterContainment: LionWebJsonContainment): void {
        if (!isEqualMetaPointer(beforeContainment.containment, afterContainment.containment)) {
            console.error("diffContainment: MetaPointers of containments should be identical")
            this.diff(
                ctx,
                `Containment Object has concept ${JSON.stringify(beforeContainment.containment)} vs ${JSON.stringify(afterContainment.containment)}`,
            )
        }
        // Check whether children exist in both objects (two for loops)
        // TODO Also check for the order that can be changed!!!
        for (const childId1 of beforeContainment.children) {
            if (!afterContainment.children.includes(childId1)) {
                this.change(new ChildRemoved(ctx, node, beforeContainment.containment.key, childId1))
            }
        }
        for (const childId2 of afterContainment.children) {
            if (!beforeContainment.children.includes(childId2)) {
                this.change(new ChildAdded(ctx, node, beforeContainment.containment.key, childId2))
            }
        }
    }

    diffLwReference(ctx: JsonContext, ref1: LionWebJsonReference, ref2: LionWebJsonReference): void {
        if (!isEqualMetaPointer(ref1.reference, ref2.reference)) {
            console.error("diffContainment: MetaPointers of containments should be identical")
            this.diff(ctx, `Reference has concept ${JSON.stringify(ref1.reference)} vs ${JSON.stringify(ref2.reference)}`)
        }
        for (const target of ref1.targets) {
            const otherTarget = NodeUtils.findLwReferenceTarget(ref2.targets, target)
            if (otherTarget === null) {
                this.diff(ctx, `REFERENCE Target ${JSON.stringify(target)} missing in second `)
            } else {
                if (target.reference !== otherTarget.reference || target.resolveInfo !== otherTarget.resolveInfo) {
                    this.diff(ctx, `REFERENCE target ${JSON.stringify(target)} vs ${JSON.stringify(otherTarget)}`)
                }
            }
        }
        for (const target of ref2.targets) {
            if (NodeUtils.findLwReferenceTarget(ref1.targets, target) === null) {
                this.diff(ctx, `REFERENCE Target ${JSON.stringify(target)} missing in first `)
            }
        }
    }

    private diffLwUsedLanguage(ctx: JsonContext, obj1: LwJsonUsedLanguage, obj2: LwJsonUsedLanguage) {
        if (obj1.key !== obj2.key || obj1.version !== obj2.version) {
            this.diff(ctx, `Different used languages ${JSON.stringify(obj1)} vs ${JSON.stringify(obj2)}`)
        }
    }

    private diffLwProperty(ctx: JsonContext, node: LionWebJsonNode, beforeProperty: LionWebJsonProperty, afterProperty: LionWebJsonProperty) {
        if (!isEqualMetaPointer(beforeProperty.property, afterProperty.property)) {
            console.error("diffContainment: MetaPointers of containments should be identical")
            this.diff(ctx, `Property Object has concept ${JSON.stringify(beforeProperty.property)} vs ${JSON.stringify(afterProperty.property)}`)
        }
        if (beforeProperty.value !== afterProperty.value) {
            this.change(new PropertyValueChanged(ctx, node.id, beforeProperty.property.key, beforeProperty.value, afterProperty.value))
        }
    }
}
