const out = document.querySelector('#out');

window.parent.addEventListener('message', (event) => {
    const { data } = event;
    if (data.type === 'string') {
        renderString(data.value);
    } else if (data.type === 'json') {
        renderJson(data.value);
    }
});

/**
 * this is what you need:
 * each node knows it's type, it may have a name or an index - it's key
 * a link to a parent
 * it knows it's level
 * it knows it's hash: line number / type / key
 * 
 * 
 * 
 */

function renderString(str) {
    out.innerHTML = str;
}

const lineHistory = new Map();

let read = false;

function renderJson(obj) {
    const lineGetter = createLineGetter();
    const root = createTree(obj, undefined, undefined, -1);
    let lineNo = 0;
    function draw(x) {
        const l = x.getLine();
        if (l != null) {
            const lineEl = lineGetter.pop();
            lineEl.innerHTML = `<span class="line" style="padding-left:${x.level * 8}px;">${triangle()}${l}</span>`
        }
        x.children.forEach(draw);
    }
    draw(root);
    lineGetter.removeRemaining();
    // out.style.fontFamily = 'monospace';
    // let lineNo = 0;
    
    // for (const { indentation, v } of toLines(undefined, obj)) {
    //     const lineEl = lineGetter.pop();
    //     lineEl.style.border = '1px solid black';
    //     const history = lineHistory.get(lineNo) ?? { lastUpdated: Date.now() - 5000, v: '', lineEl };
    //     if (v !== history.v) {
    //         lineEl.style.paddingLeft = `${indentation*16}px`;
    //         lineEl.innerHTML = v;
    //         lineHistory.set(lineNo, { lastUpdated: Date.now(), v });
    //         animateElement(lineEl);
    //     }
    //     lineNo++;
    // }
    
    read = true;
}

function createLineGetter() {
    const lineEls = [...out.querySelectorAll('.animateLine')];
    return {
        pop: () => {
            let el = lineEls.shift();
            if (el) {
                return el;
            }
            el = document.createElement('div');
            el.className = 'animateLine';
        
            out.appendChild(el);
            return el;
        },
        unshift: el => lineEls.unshift(el),
        removeRemaining: () => {
            console.log('removing', lineEls.length)
            lineEls.forEach(el => out.removeChild(el));
        },
    };
}

function * toLines(key, obj, indentation = 0, prefix2 = '&nbsp;') {
    if (!read) {
        console.log(obj, Node.getType(obj));
    }
    if (typeof obj !== 'object') {
        const prefix = key ? `${colorit(key, 'blue')}: ` : '';
        yield ({ indentation, v: `${prefix2}${prefix}${colorVal(obj)}` });    
        return;
    }
    key && (yield ({ indentation: indentation-1, v: `${prefix2}${colorit(key, 'blue')}:` }));
    if (Array.isArray(obj)) {
        for (const item of obj) {
            yield * toLines(undefined, item, indentation, prefix2);
        }
        return;
    }
    let first = true;
    for (const [key, value] of Object.entries(obj)) {
        const valueType = typeof value;
        if (valueType === 'object') {
            if (Array.isArray(value)) {
                if (value.length)
                    yield * toLines(key, value, indentation+1, '-');
                else {
                    const prefix = key ? `${colorit(key, 'blue')}: ` : '';
                    yield ({ indentation, v: `${first ? prefix2 : '&nbsp;'}${prefix}${colorVal(value)}` });    
                }
            } else {
                yield * toLines(key, value, indentation+1, first ? prefix2 : undefined);
            }
        } else {
            yield * toLines(key, value, indentation, first ? prefix2 : undefined);
        }
        first = false;
    }
}

function createTree(obj, parent, key, level = 0) {
    const node = new Node(obj, parent, key, level);
    node.getChildValues().forEach(([k, v]) => {
        node.children.push(createTree(v, node, k, level + 1))
    });
    return node;
}

function colorVal(item) {
    if (typeof item === 'boolean') {
        return colorit(item, item ? 'green' : 'red');
    } else if (typeof item === 'number') {
        return colorit(item, 'brown');
    }

    const colorRegex = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/g;
    if (typeof item === 'string' && colorRegex.test(item)) {
        return colorit(item, item);
    }

    return JSON.stringify(item);
}

function colorit(str, color) {
    return `<span style="color:${color}">${str}</span>`
}

function animateElement(el) {
    el.classList.remove("animateLine");
    void el.offsetWidth;
    el.classList.add("animateLine");
}

function isColor(input) {
    if (typeof input !== 'string') return false;
    const colorRegex = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/g;
    if (typeof item === 'string' && colorRegex.test(item)) {
        return colorit(item, item);
    }
}


class Node {
    constructor(value, parent, key, level = 0) {
        this.value = value;
        this.type = Node.getType(value);
        this.parent = parent;
        this.key = key;
        this.level = level;
        this.children = [];
        this._hash = undefined;
    }

    getChildValues() {
        if (this.type === 'object') return [...Object.entries(this.value)];
        if (this.type === 'array') return this.value.map((v, k) => [k, v]);
        if (this.type === 'map') return [...this.value.entries()];
        return [];
    }

    hash() {
        if (this._hash) return this._hash;
        const parentHash = this.parent?.hash() ?? '';
        this._hash = ['object', 'array', 'map'].includes(this.type)
            ? str(parentHash, ':', this.type)
            : str(parentHash, ':', JSON.stringify(value));
        return this._hash;
    }

    getLine() {
        if (this.key == null) return undefined;
        if (this.type === 'array') {
            return this.value.length
                ? str(this.key ?? '', ': Array(', this.value.length, ')')
                : str(this.key, ': []');
        }
        if (this.type === 'map') {
            const numKeys = Object.keys(this.value).length;
            return numKeys
                ? str(this.key, ': Map(', numKeys, ')')
                : str(this.key, ': Map(empty)');
        }
        if (['array', 'object'].includes(this.type)) {
            return str(this.key, ':');
        }
        return this.key + ': ' + JSON.stringify(this.value);
    }

    static getType(v) {
        const type = typeof v;
        switch (type) {
            case 'object':
                if (Array.isArray(v)) return 'array';
                if (v instanceof Map) return 'map';
                if (v instanceof Set) return 'set';
                return 'object';
            case 'number':
            case 'boolean':
            case 'string':
                return type;
        }
    }
}

function str(...strs) {
    return strs.join('');
}

function triangle(down = true) {
    const deg = down ? 180 : 90;
    return '<svg viewBox="0 0 10 10"><polygon points="0,10 10,10 5,0" fill="rgb(181 191 200)" style="transform:rotate(' + deg + 'deg); transform-origin:center;" /></svg>';
}
