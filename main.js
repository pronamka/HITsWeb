const algorithmNames = new Array(
    'a-star',
    'clusterize',
    'genetics',
    'ant',
    'solution-tree',
    'neural-network'
);

const headerButtonPrefix = 'go-to-algorithm-';
const algorithmTabPrefix = 'algorithm-';

const headerButtons = new Array();
const algoirthmTabs = new Array();

for (let i = 0; i < algorithmNames.length; i++) {
    headerButtons.push(document.getElementById(headerButtonPrefix + algorithmNames[i]));
    algoirthmTabs.push(document.getElementById(algorithmTabPrefix + algorithmNames[i]));

    headerButtons[i].addEventListener('click', () => displayTab(i));
}

const displayTab = (tabIndex) => {
    for (let i = 0; i < algoirthmTabs.length; i++) {
        algoirthmTabs[i].style.display = 'none';
    }
    algoirthmTabs[tabIndex].style.display = 'block';
};

displayTab(0);
