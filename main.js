const algorithmNames = [
    'a-star',
    'clusterize',
    'genetics',
    'ant',
    'decision-tree',
    'neural-network',
];

const algorithmFiles = {
    'a-star': ['aStar/Screens/maze.html', ['aStar/Styles/maze.css'], ['aStar/Scripts/maze.js']],
    clusterize: [
        'Clusterization/Screens/clusterization.html',
        ['Clusterization/Styles/clusterization.css'],
        ['Clusterization/Scripts/clusterization.js'],
    ],
    ant: ['Ants/Screens/Ants.html', ['Ants/Styles/Ants.css'], ['Ants/Scripts/Ants.js']],
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
        ['neural_network/neural_network.js'],
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

displayTab(1);

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
