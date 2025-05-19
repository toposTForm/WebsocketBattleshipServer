export type ResReg  = {
    type: "reg",
    data:
        {
            name: string,
            index: number | string,
            error: boolean,
            errorText: string,
        } | string,
    id: 0,
}

export type ResUpdateWinners = {
    type: "update_winners",
    data: 
        [
            {
                name: string,
                wind: number
            }
        ] | string,
    id: 0,
}

export type ResAddUserToRoom = {
    type: "add_user_to_room",
    data:
        {
            indexRoom: number | string,
        },
    id: 0,
}
// export type ResUpdateRoom = {
//     type: "update_room",
//     data:
//         [
//             {
//                 roomId?: number | string,
//                 roomUsers: Array<{name: string, index: number | string}>
//             },
//         ],
//     id: 0,
// }

export type ResUpdateRoom = {
    type: "update_room",
    data: {
        roomId: number | string;
        roomUsers: {}[];
    }[] | string,
    id: 0,
}