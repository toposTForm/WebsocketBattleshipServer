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

export type ReqAddUserToRoom  = {
    type: "add_user_to_room",
    data:
        {
            indexRoom: number | string,
        },
    id: 0,
}

export type ReqAddShips = {
    type: "add_ships",
    data:
        {
            gameId: number | string,
            ships:
                [
                    {
                        position: {
                            x: number,
                            y: number,
                        },
                        direction: boolean,
                        length: number,
                        type: "small"|"medium"|"large"|"huge",
                    }
                ],
            indexPlayer: number | string, /* id of the player in the current game session */
        },
    id: 0,
}

export type ReqAttack = {
    type: "attack",
    data:
        {
            gameId: number | string,
            x: number,
            y: string,
            indexPlayer: number | string, /* id of the player in the current game session */
        },
    id: 0,
}

export type ReqRandomAttack = {
    type: "randomAttack",
    data:
        {
            gameId: number | string,
            indexPlayer: number | string, /* id of the player in the current game session */
        } | string,
    id: 0,
}