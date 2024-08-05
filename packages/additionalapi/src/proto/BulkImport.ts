// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.1
//   protoc               v5.27.1
// source: src/proto/BulkImport.proto

/* eslint-disable */
import _m0 from "protobufjs/minimal.js";
import { PBMetaPointer, PBNode } from "./Chunk.js";

export const protobufPackage = "io.lionweb.lioncore.protobuf";

export interface PBBulkImport {
  /** We use this mechanism both to save space and to represent nulls (identified by -1) */
  stringValues: string[];
  metaPointers: PBMetaPointer[];
  attachPoints: PBAttachPoint[];
  nodes: PBNode[];
}

export interface PBAttachPoint {
  container: number;
  metaPointerIndex: number;
  rootId: number;
}

function createBasePBBulkImport(): PBBulkImport {
  return { stringValues: [], metaPointers: [], attachPoints: [], nodes: [] };
}

export const PBBulkImport = {
  encode(message: PBBulkImport, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.stringValues) {
      writer.uint32(10).string(v!);
    }
    for (const v of message.metaPointers) {
      PBMetaPointer.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.attachPoints) {
      PBAttachPoint.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.nodes) {
      PBNode.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PBBulkImport {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePBBulkImport();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.stringValues.push(reader.string());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.metaPointers.push(PBMetaPointer.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.attachPoints.push(PBAttachPoint.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.nodes.push(PBNode.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PBBulkImport {
    return {
      stringValues: globalThis.Array.isArray(object?.stringValues)
        ? object.stringValues.map((e: any) => globalThis.String(e))
        : [],
      metaPointers: globalThis.Array.isArray(object?.metaPointers)
        ? object.metaPointers.map((e: any) => PBMetaPointer.fromJSON(e))
        : [],
      attachPoints: globalThis.Array.isArray(object?.attachPoints)
        ? object.attachPoints.map((e: any) => PBAttachPoint.fromJSON(e))
        : [],
      nodes: globalThis.Array.isArray(object?.nodes) ? object.nodes.map((e: any) => PBNode.fromJSON(e)) : [],
    };
  },

  toJSON(message: PBBulkImport): unknown {
    const obj: any = {};
    if (message.stringValues?.length) {
      obj.stringValues = message.stringValues;
    }
    if (message.metaPointers?.length) {
      obj.metaPointers = message.metaPointers.map((e) => PBMetaPointer.toJSON(e));
    }
    if (message.attachPoints?.length) {
      obj.attachPoints = message.attachPoints.map((e) => PBAttachPoint.toJSON(e));
    }
    if (message.nodes?.length) {
      obj.nodes = message.nodes.map((e) => PBNode.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<PBBulkImport>, I>>(base?: I): PBBulkImport {
    return PBBulkImport.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<PBBulkImport>, I>>(object: I): PBBulkImport {
    const message = createBasePBBulkImport();
    message.stringValues = object.stringValues?.map((e) => e) || [];
    message.metaPointers = object.metaPointers?.map((e) => PBMetaPointer.fromPartial(e)) || [];
    message.attachPoints = object.attachPoints?.map((e) => PBAttachPoint.fromPartial(e)) || [];
    message.nodes = object.nodes?.map((e) => PBNode.fromPartial(e)) || [];
    return message;
  },
};

function createBasePBAttachPoint(): PBAttachPoint {
  return { container: 0, metaPointerIndex: 0, rootId: 0 };
}

export const PBAttachPoint = {
  encode(message: PBAttachPoint, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.container !== 0) {
      writer.uint32(8).int32(message.container);
    }
    if (message.metaPointerIndex !== 0) {
      writer.uint32(16).int32(message.metaPointerIndex);
    }
    if (message.rootId !== 0) {
      writer.uint32(24).int32(message.rootId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PBAttachPoint {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePBAttachPoint();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.container = reader.int32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.metaPointerIndex = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.rootId = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PBAttachPoint {
    return {
      container: isSet(object.container) ? globalThis.Number(object.container) : 0,
      metaPointerIndex: isSet(object.metaPointerIndex) ? globalThis.Number(object.metaPointerIndex) : 0,
      rootId: isSet(object.rootId) ? globalThis.Number(object.rootId) : 0,
    };
  },

  toJSON(message: PBAttachPoint): unknown {
    const obj: any = {};
    if (message.container !== 0) {
      obj.container = Math.round(message.container);
    }
    if (message.metaPointerIndex !== 0) {
      obj.metaPointerIndex = Math.round(message.metaPointerIndex);
    }
    if (message.rootId !== 0) {
      obj.rootId = Math.round(message.rootId);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<PBAttachPoint>, I>>(base?: I): PBAttachPoint {
    return PBAttachPoint.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<PBAttachPoint>, I>>(object: I): PBAttachPoint {
    const message = createBasePBAttachPoint();
    message.container = object.container ?? 0;
    message.metaPointerIndex = object.metaPointerIndex ?? 0;
    message.rootId = object.rootId ?? 0;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
