export class Config {
    static GRID = {
        WIDTH: 25,
        HEIGHT: 25
    };

    static COLORS = {
        CHOSEN_CELL: '#b5b094',
        TRANSPARENT: 'transparent',
        ALGORITHM_COLORS: [
            [
                '#FF0000', '#33FF57', '#3357FF', '#F3FF33',
                '#FF33F3', '#33FFF3', '#FF8C33', '#9933FF', '#33FF99'
            ],
            [
                '#FF9999', '#99FF99', '#9999FF', '#FFFF99',
                '#FF99FF', '#99FFFF', '#FFCC99', '#CC99FF', '#99FFCC'
            ],
            [
                '#CC8888', '#88CC88', '#8888CC', '#CCCC88',
                '#CC88CC', '#88CCCC', '#CC9988', '#AA88CC', '#88CCAA'
            ]
        ]
    };

    static CLUSTERING = {
        MAX_ITERATIONS: 100,
        CONVERGENCE_THRESHOLD: 0.001,
        MIN_BATCH_SIZE: 10,
        MAX_CLUSTERS: 9,
    };

    static CSS_CLASSES = {
        KMEANS_ACTIVE: 'kmeans-start-btn-activate',
        KMEANS_INACTIVE: 'kmeans-start-btn-deactivate',
        HIERARCHICAL_ACTIVE: 'hierarchical-start-btn-activate',
        HIERARCHICAL_INACTIVE: 'hierarchical-start-btn-deactivate',
        MINI_BATCH_ACTIVE: 'miniBatchKMeans-start-btn-activate',
        MINI_BATCH_INACTIVE: 'miniBatchKMeans-start-btn-deactivate',
        GRID_CELL: 'algorithm-clusterize-cell',
        GRID_ROW: 'algorithm-clusterize-row',
        GRID_SUBCELL: 'algorithm-clusterize-sub-cell',
        GRID_SUBSUBCELL: 'algorithm-clusterize-sub-sub-cell'
    };

    static DOM_IDS = {
        GRID: 'algorithm-clusterize-grid',
        KMEANS_BTN: 'kmeans-start-btn',
        HIERARCHICAL_BTN: 'hierarchical-start-btn',
        MINIBATCH_BTN: 'miniBatchKMeans-start-btn',
        CLUSTERS_INPUT: 'clusters',
        CLEAR_BTN: 'clear-Btn'
    };
}