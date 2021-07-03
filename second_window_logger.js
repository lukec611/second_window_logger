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

    render(prevTree);
}

let prevTree = undefined;
function renderJson(obj) {
    const root = createTree(obj, undefined, undefined, -1);
    render(root);
}

function render(root) {
    const outEl = document.querySelector('#out');
    draw(outEl, root, prevTree, true);
    prevTree = root;
}

function createTree(obj, parent, key, level = 0) {
    const node = new Node(obj, parent, key, level);
    node.getChildValues().forEach(([k, v]) => {
        node.children.push(createTree(v, node, k, level + 1))
    });
    return node;
}

function draw(container, current, prev, display) {
    const l = current.getLine();
    const canCollapse = current.canCollapse();
    const hash = current.hash();
    const futureDisplay = display && (!canCollapse || !collapsed.has(hash));
    const hashEq = hash === prev?.hash();

    // html management
    let lineEl;
    let childrenContainer;
    const containerChildren = [...container.children];
    if (containerChildren.length !== 2) {
        containerChildren.forEach(c => container.removeChild(c));
        lineEl = createLine();
        lineEl.classList.add('animateLine');
        childrenContainer = createLine();
        container.appendChild(lineEl);
        container.appendChild(childrenContainer);
    } else {
        lineEl = containerChildren[0];
        childrenContainer = containerChildren[1];
    }
    
    if (display && !futureDisplay) lineEl.classList.add('collapsed');
    else lineEl.classList.remove('collapsed');

    lineEl.style.display = display ? 'grid' : 'none';
    
    if (!hashEq) {
        lineEl.innerHTML = canCollapse
            ? triangle(hash, 'toggleCollapse(event)')
            : '<span class="spacer"></span>';
        lineEl.style.paddingLeft = (current.level * 8) + 'px';
        l.forEach(item => {
            lineEl.innerHTML += '<span class="' + item.className + '">' + item.contents + '</span>';
        });
        if (isColor(current.value)) {
            lineEl.innerHTML += '<span onclick="copycolor(event)" data-color="' + current.value + '" class="color-copier" style="background-color:' + current.value + ';"></span>';
        }
        animateElement(lineEl);
    }
    const prevChildren = prev?.children ?? [];
    const childContainers = [...childrenContainer.children];
    current.children.forEach((child, index) => {
        let childContainer = childContainers.shift();
        if (!childContainer) {
            childContainer = createLine();
            childrenContainer.appendChild(childContainer);
        }
        draw(childContainer, child, prevChildren[index], futureDisplay);
    });
    childContainers.forEach(c => childrenContainer.removeChild(c));
}

function createLine() {
    const el = document.createElement('div');
    return el;
}

function animateElement(el) {
    el.classList.remove("animateLine");
    void el.offsetWidth;
    el.classList.add("animateLine");
}

function isColor(x) {
    if (typeof x !== 'string') return false;
    const colorRegex = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/g;
    return colorRegex.test(x);
}

class Node {
    constructor(value, parent, key = 'root', level = 0) {
        this.type = Node.getType(value);
        this.value = this.type === 'array'
            ? value.filter(x => x)
            : value;
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
        const { type, key, value } = this; 
        const numChildren = this.childrenCount();

        let contents = undefined;
        if (type === 'array') contents = numChildren === 0 ? '[]' : collectionStr('Array', numChildren);
        if (type === 'map') contents = collectionStr('Map', numChildren);
        if (type === 'object') contents = collectionStr('Object', numChildren);
        if (contents) {
            return [
                { className: 'key-color', contents: key },
                { className: 'light-color', contents: str(':&nbsp;', contents) },
            ];
        }

        return [
            { className: 'key-color', contents: key },
            { className: 'light-color', contents: ':&nbsp;' },
            { className: 'type-' + type, contents: JSON.stringify(value) },
        ];
    }

    static getType(v) {
        const type = typeof v;
        if (type === 'object') {
            if (Array.isArray(v)) return 'array';
            if (v instanceof Map) return 'map';
            if (v instanceof Set) return 'set';
        }
        return type;
    }
}

function str(...strs) { return strs.join(''); }

function triangle(collapseHash, onclick = '') {
    return '<svg data-collapse-hash="' + collapseHash + '" onclick="'+ onclick +'" viewBox="0 0 10 10"><polygon points="0,10 10,10 5,0" fill="rgb(181 191 200)"/></svg>';
}

function collectionStr(name, count) { return str(name, '(', count, ')'); }

function copycolor(event) {
    const color = event.target.dataset.color;
    copyToClipboard(color);
}

function copyToClipboard(value) {
    const tempInput = document.createElement("textarea");
    tempInput.style = 'position: absolute; left: -1000px; top: -1000px';
    tempInput.value = value;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
}
