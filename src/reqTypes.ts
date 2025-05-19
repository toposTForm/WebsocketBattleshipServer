export type ReqReg  = {
    type: "reg",
    data:
    {
        name: string,
        password: string,
    },
    id: 0,
}

export type ReqCreateRoom = {
    type: "create_room",
    data: "",
    id: 0,
}

