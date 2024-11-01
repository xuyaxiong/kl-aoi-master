export class AddDictTypeParam {
  typeCode: string;
  typeName: string;
  desc: string;
  sort: number;
}

export class AddDictItemParam {
  typeCode: string;
  code: string;
  name: string;
  value: string;
  desc: string;
  sort: number;
}

export class GetDictItemParam {
  typeCode: string;
  code: string;
}

export class GetDictTypeParam {
  typeCode: string;
}

export class GetDictItemListParam {
  typeCode: string;
}

export class UpdateDictItemParam {
  typeCode: string;
  code: string;
  name?: string;
  value?: string;
}

export class GetItemListParam {
  code: string;
  name: string;
}
