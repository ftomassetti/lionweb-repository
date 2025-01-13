// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

import { FBMetaPointer } from '../../../../../io/lionweb/serialization/flatbuffers/gen/fbmeta-pointer.js';


export class FBAttachPoint {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):FBAttachPoint {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsFBAttachPoint(bb:flatbuffers.ByteBuffer, obj?:FBAttachPoint):FBAttachPoint {
  return (obj || new FBAttachPoint()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsFBAttachPoint(bb:flatbuffers.ByteBuffer, obj?:FBAttachPoint):FBAttachPoint {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new FBAttachPoint()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

container():string|null
container(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
container(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

containment(obj?:FBMetaPointer):FBMetaPointer|null {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? (obj || new FBMetaPointer()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

root():string|null
root(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
root(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

static startFBAttachPoint(builder:flatbuffers.Builder) {
  builder.startObject(3);
}

static addContainer(builder:flatbuffers.Builder, containerOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, containerOffset, 0);
}

static addContainment(builder:flatbuffers.Builder, containmentOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, containmentOffset, 0);
}

static addRoot(builder:flatbuffers.Builder, rootOffset:flatbuffers.Offset) {
  builder.addFieldOffset(2, rootOffset, 0);
}

static endFBAttachPoint(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

}
