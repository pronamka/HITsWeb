export class Config{
    static WIDTH = 110;
    static HEIGHT = 110;

    static EVAPORATION_FOOD = 0.000005;
    static EVAPORATION_HOME = 0.000005;

    static TO_FOOD_REFUSE_COEFFICIENT = 0.99;
    static MAX_DISTANCE = 1000;
    static CHANCE_TO_GO_HOME = 0.01;
    static RANGE = 15;
    static INCREASE_COEFFICIENT = 4;
    static HERD_COEFFICIENT = 1.65;
    static MIN_IMPROVE_VALUE = 0.00000001;
    static EQUALIZATION_COEFFICIENT = 10000000

    static DEFAULT_START_X = 35;
    static DEFAULT_START_Y = 35;

    static PAINT_STATE = {
        CLEAR: 0,
        WALL: 1,
        FOOD: 2,
        NEST: 3
    };

    static DEFAULT_SPEED = 83.3;

    static START_BUTTON_FIRST_STATE = 'btnStartState1'
    static START_BUTTON_SECOND_STATE = 'btnStartState2'
}