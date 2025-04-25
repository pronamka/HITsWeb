export class Config {
    static MAX_BOARD_SIZE_PX_COEFFICIENT = 0.7
    static MAX_TILE_SIZE = 20
    static CLASS_MAP = new Map([
        [0, 'open'],
        [1, 'closed'],
        [2, 'start'],
        [3, 'finish'],
        [4, 'to-searh'],
        [5, 'visited'],
        [6, 'path'],
    ]);
    static START_FIELD_SIZE = 35

}