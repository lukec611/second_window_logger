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

function draw(container, current, prev) {
    const l = current.getLine();
    const canCollapse = current.canCollapse();
    const hash = current.hash();
    const hashEq = hash === prev?.hash();

    let lineEl;
    let childrenContainer;
    const containerChildren = [...container.children];
    if (containerChildren.length !== 2) {
        containerChildren.forEach(c => container.removeChild(c));
        lineEl = document.createElement('div');
        lineEl.className = 'animated-line';
        childrenContainer = document.createElement('div');
        childrenContainer.style.paddingLeft = '8px';
        container.appendChild(lineEl);
        container.appendChild(childrenContainer);
    } else {
        lineEl = containerChildren[0];
        childrenContainer = containerChildren[1];
    }
    
    if (!hashEq || current.childrenCount() !== prev?.childrenCount()) {
        lineEl.innerHTML = '';
        const content = document.createElement('div');
        content.classList.add('display-line');
        if (canCollapse) {
            const btn = collapseButton(hash);
            btn.onclick = () => {
                const shouldCollapse = childrenContainer.style.display !== 'none';
                childrenContainer.style.display = shouldCollapse ? 'none' : 'block';
                const poly = lineEl.querySelector('polygon');
                if (poly) poly.style.transform = shouldCollapse ? 'rotate(90deg)' : 'rotate(180deg)';
            };
            lineEl.appendChild(btn);
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'spacer';
            lineEl.appendChild(spacer);
        }
        lineEl.appendChild(content);
        
        l.forEach(item => {
            content.innerHTML += '<span class="' + item.className + '">' + item.contents + '</span>';
        });
        if (isColor(current.value)) {
            content.innerHTML += '<span onclick="copycolor(event)" data-color="' + current.value + '" class="color-copier" style="background-color:' + current.value + ';"></span>';
        } else if (canCollapse) {
            const copyBtn = copyButton();
            copyBtn.onclick = () => current.copyToClipboard();
            content.appendChild(copyBtn);
        }
        animateElement(lineEl);
    }

    const prevChildren = prev?.children ?? [];
    const childContainers = [...childrenContainer.children];
    current.children.forEach((child, index) => {
        let childContainer = childContainers.shift();
        if (!childContainer) {
            childContainer = document.createElement('div');
            childrenContainer.appendChild(childContainer);
        }
        draw(childContainer, child, prevChildren[index]);
    });
    childContainers.forEach(c => childrenContainer.removeChild(c));
}

function animateElement(el) {
    el.classList.remove("animated-line");
    void el.offsetWidth;
    el.classList.add("animated-line");
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
        if (this.type === 'object') return [...Object.entries(this.value)].sort(([a], [b]) => a.localeCompare(b));
        if (this.type === 'array') return this.value.map((v, k) => [k, v]);
        if (this.type === 'map') return [...this.value.entries()].sort(([a], [b]) => a.localeCompare(b));
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
        return ['object', 'array', 'map'].includes(this.type) && this.childrenCount() !== 0;
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
            { className: 'type-' + type, contents: escapeHtml(JSON.stringify(value)) },
        ];
    }

    copyToClipboard() {
        copyToClipboard(JSON.stringify(this.value, simplifyComplexTypes, 2));
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

function collapseButton() {
    const collapseArrow = '<svg viewBox="0 0 10 10"><polygon style="transform-origin:center;transform:rotate(180deg);" points="0,10 10,10 5,0" fill="rgb(181 191 200)"/></svg>';
    const button = document.createElement('button');
    button.className = 'action-btn';
    button.innerHTML = collapseArrow;
    return button;
}

function copyButton() {
    const copyIcon = [
        '<div style="border:1px solid rgba(206, 206, 206, 0.461);width:6px;height:6px;position:absolute;top:1px;left:1px;"></div>',
        '<div style="border:1px solid rgba(206, 206, 206, 0.461);width:6px;height:6px;position:absolute;top:4px;left:4px;"></div>',
    ].join('');
    const button = document.createElement('button');
    button.className = 'action-btn';
    button.style.position = 'relative';
    button.innerHTML = copyIcon;
    button.onmouseover = () => [...button.children].forEach(c => c.style.borderColor = 'white');
    button.onmouseout = () => [...button.children].forEach(c => c.style.borderColor = 'rgba(206, 206, 206, 0.461)');
    return button;
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

function simplifyComplexTypes(key, value) {
    if(value instanceof Map) {
      return { dataType: 'Map', entries: Array.from(value.entries()) };
    } else if (value instanceof Set) return { dataType: 'set', items: [...value] };
    return value;
}

function escapeHtml(unsafe = '') {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
