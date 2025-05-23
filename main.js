const algorithmNames = [
    'start-page',
    'a-star',
    'clusterize',
    'genetics',
    'ant',
    'decision-tree',
    'neural-network',
];

const algorithmFiles = {
    'start-page': ['start-page/startPage.html', ['start-page/startPage.css']],
    'a-star': ['aStar/Screens/maze.html', ['aStar/Styles/maze.css'], ['aStar/Scripts/maze.js']],
    clusterize: [
        'Clusterization/Screens/clusterization.html',
        ['Clusterization/Styles/clusterization.css'],
        ['Clusterization/Scripts/clusterization.js'],
    ],
    genetics: ['genetic/Screens/gen.html', ['genetic/Styles/gen.css'], ['genetic/Scripts/gen.js']],
    ant: ['Ants/Screens/ants.html', ['Ants/Styles/ants.css'], ['Ants/Scripts/ants.js']],
    'decision-tree': [
        'decision_tree/decision_tree.html',
        ['decision_tree/decision_tree.css'],
        [
            'decision_tree/decision_tree.js',
            'decision_tree/get_input.js',
            'decision_tree/visualizer.js',
        ],
    ],
    'neural-network': [
        'neural_network/neural_network.html',
        ['neural_network/neural_network.css'],
        ['neural_network/Scripts/neuralNetwork.js'],
    ],
};

const headerButtonPrefix = 'go-to-algorithm-';
const algorithmTabPrefix = 'algorithm-';

const headerButtons = [];
const algorithmTabs = [];

for (let i = 0; i < algorithmNames.length; i++) {
    headerButtons.push(document.getElementById(headerButtonPrefix + algorithmNames[i]));
    algorithmTabs.push(document.getElementById(algorithmTabPrefix + algorithmNames[i]));

    headerButtons[i].addEventListener('click', () => displayTab(i));
}

const displayTab = (tabIndex) => {
    for (let i = 0; i < algorithmTabs.length; i++) {
        algorithmTabs[i].style.display = 'none';
    }
    algorithmTabs[tabIndex].style.display = 'block';
};

displayTab(0);

function loadTab(algorithmName, file, cssPaths = null, jsPaths = null) {
    fetch(file)
        .then((response) => response.text())
        .then((html) => {
            document.getElementById(`algorithm-${algorithmName}`).innerHTML = html;

            if (cssPaths) {
                cssPaths.forEach((path) => {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = path;
                    document.head.appendChild(link);
                });
            }

            if (jsPaths) {
                jsPaths.forEach((path) => {
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.defer = true;
                    script.src = path;
                    document.body.appendChild(script);
                });
            }
        });
}

window.onload = () => {
    for (const [algorithmName, files] of Object.entries(algorithmFiles)) {
        loadTab(algorithmName, ...files);
    }
};
