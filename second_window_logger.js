const out = document.querySelector('#out');

window.parent.addEventListener('message', (event) => {
    const { data } = event;
    if (data.type === 'string') {
        renderString(data.value);
    } else if (data.type === 'json') {
        renderJson(data.value);
    }
});

function renderString(str) {
    out.innerHTML = str;
}

const collapsed = new Set();
function toggleCollapse(event) {
    const k = event.target.dataset.collapseHash;
    if (collapsed.has(k)) collapsed.delete(k);
    else collapsed.add(k);

    const lineGetter = createLineGetter();
    draw(lineGetter, prevTree, prevTree, true);
    lineGetter.removeRemaining();
}

let prevTree = undefined;
function renderJson(obj) {
    const lineGetter = createLineGetter();
    const root = createTree(obj, undefined, undefined, -1);
    
    draw(lineGetter, root, prevTree, true);
    lineGetter.removeRemaining();
    prevTree = root;
}

function draw(lineGetter, x, prev, display) {
    const l = x.getLine();
    const canCollapse = x.canCollapse();
    const hash = x.hash();
    const futureDisplay = display && (!canCollapse || !collapsed.has(hash));
    if (l != null) {
        const hashEq = hash === prev?.hash();
        const lineEl = lineGetter.pop();
        if (display && !futureDisplay) lineEl.classList.add('collapsed');
        else lineEl.classList.remove('collapsed');

        lineEl.style.display = display ? 'grid' : 'none';
        
        if (!hashEq) {
            lineEl.innerHTML = canCollapse
                ? triangle(hash, 'toggleCollapse(event)')
                : '<span class="spacer"></span>';
            lineEl.style.paddingLeft = (x.level * 8) + 'px';
            l.forEach(item => {
                lineEl.innerHTML += `<span class="${item.className}">${item.contents}</span>`;
            });
            animateElement(lineEl);
        }
    }
    const prevChildren = prev?.children ?? [];
    x.children.forEach((child, index) => draw(lineGetter, child, prevChildren[index], futureDisplay));
}

function createLineGetter() {
    const lineEls = [...out.querySelectorAll('.animateLine')];
    return {
        pop: () => {
            let el = lineEls.shift();
            if (el) return el;

            el = document.createElement('div');
            el.classList.add('animateLine');
            out.appendChild(el);
            return el;
        },
        removeRemaining: () => lineEls.forEach(el => out.removeChild(el)),
    };
}

function createTree(obj, parent, key, level = 0) {
    const node = new Node(obj, parent, key, level);
    node.getChildValues().forEach(([k, v]) => {
        node.children.push(createTree(v, node, k, level + 1))
    });
    return node;
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
            ? str(parentHash, ':', this.type, ':', this.key)
            : str(parentHash, ':', this.key, ':', JSON.stringify(this.value));
        return this._hash;
    }

    canCollapse() {
        return ['object', 'array', 'map'].includes(this.type);
    }

    childrenCount() {
        if (this.type === 'array') return this.value.length;
        if (this.type === 'map') return [...this.value.keys()].length;
        if (this.type === 'object') return Object.keys(this.value).length;
    }

    getLine() {
        const { key, value } = this; 
        if (key == null) return undefined;
        
        const numChildren = this.childrenCount();

        let contents = undefined;
        if (this.type === 'array') contents = numChildren === 0 ? '[]' : collectionStr('Array', numChildren);
        if (this.type === 'map') contents = collectionStr('Map', numChildren);
        if (this.type === 'object') contents = collectionStr('Object', numChildren);
        if (contents) {
            return [
                { className: 'key-color', contents: this.key },
                { className: 'light-color', contents: str(':&nbsp;', contents) },
            ];
        }

        return [
            { className: 'key-color', contents: this.key },
            { className: 'light-color', contents: ':&nbsp;' },
            { className: 'type-' + this.type, contents: JSON.stringify(this.value) },
        ];
    }

    static getType(v) {
        const type = typeof v;
        switch (type) {
            case 'object':
                if (Array.isArray(v)) return 'array';
                if (v instanceof Map) return 'map';
                if (v instanceof Set) return 'set';
                return 'object';
            default:
                return type;
        }
    }
}

function str(...strs) { return strs.join(''); }

function triangle(collapseHash, onclick = '') {
    return '<svg data-collapse-hash="' + collapseHash + '" onclick="'+ onclick +'" viewBox="0 0 10 10"><polygon points="0,10 10,10 5,0" fill="rgb(181 191 200)"/></svg>';
}

function collectionStr(name, count) { return str(name, '(', count, ')'); }
