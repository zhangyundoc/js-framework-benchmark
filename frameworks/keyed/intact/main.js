import Intact from 'intact'
import template from './index.vdt'


function _random(max) {
    return Math.round(Math.random()*1000)%max;
}

let id = 1;

let startTime;
let lastMeasure;
let startMeasure = function(name) {
    startTime = performance.now();
    lastMeasure = name;
};
let stopMeasure = function() {
    let last = lastMeasure;
    if (lastMeasure) {
        lastMeasure = null;
        let stop = performance.now();
        console.log(last + " took " + (stop - startTime));
    }
};

export default class Page extends Intact{
    @Intact.template()
    static template = template;

    defaults() {
        return {
            rows: [],
            selected: undefined,
            id: 1,
        }
    }

    buildData(count = 1000) {
        // let id = 1;
        var adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
        var colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
        var nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
        var data = [];
        for (let i = 0; i < count; i++)
            data.push({id: id++, label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)] });
        return data;
    }
    updateData(mod = 10) {
        let newData = [...this.get('rows')];

        for (let i = 0; i < newData.length; i += 10) {
            newData[i].label += ' !!!';
        }
        this.set('rows', newData);
        this.update();
    }

    _init() {

    }

    _update() {
        stopMeasure()
    }

    _mount() {

    }

    _destroy() {

    }

    run() {
        startMeasure('run');
        let data = this.get('rows');
        this.set('rows', this.buildData(1000).concat(data));
    }
    runLots() {
        startMeasure('runLots');
        let data = this.get('rows');
        this.set('rows', this.buildData(10000).concat(data));
    }
    add() {
        startMeasure('add');
        this.set('rows', this.get('rows').concat(this.buildData(1000)));
    }
    _testupdate() {
        startMeasure('update');
        this.updateData();
    }
    clear() {
        startMeasure('clear');
        this.set('rows', []);
    }
    swapRows() {
        startMeasure('swapRows');
        let data = this.get('rows') || [];
        if(data.length > 998) {
            let d1 = data[1];
            let d998 = data[998];

            let newData = this.get('rows').map(function(data, i) {
                if(i === 1) {
                    return d998;
                }
                else if(i === 998) {
                    return d1;
                }
                return data;
            });
            this.set('rows', newData);
        }

    }
    handleClick(e) {
        startMeasure('select');
        const { action, id } = e.target.dataset;
        if (action && id) {
            this.set('selected', id);
        }
    }
    remove(id) {
        startMeasure('remove');
        let data = this.get('rows');
        const idx = data.findIndex(d => d.id == id);
        this.set('rows', data.slice(0, idx).concat(data.slice(idx + 1)));
    }
}

Intact.mount(Page, document.getElementById('main'));