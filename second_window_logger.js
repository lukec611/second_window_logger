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

const lineHistory = new Map();

function renderJson(obj) {
    out.style.fontFamily = 'monospace';
    let lineNo = 0;
    const lineGetter = createLineGetter();
    for (const { indentation, v } of toLines(undefined, obj)) {
        const lineEl = lineGetter.pop();
        const history = lineHistory.get(lineNo) ?? { lastUpdated: Date.now() - 5000, v: '', lineEl };
        if (v !== history.v) {
            lineEl.style.paddingLeft = `${indentation*16}px`;
            lineEl.innerHTML = v;
            lineEl.classList.remove("animateLine");
            void lineEl.offsetWidth;
            lineHistory.set(lineNo, { lastUpdated: Date.now(), v });
            lineEl.classList.add("animateLine");
        }
        lineNo++;
    }
    lineGetter.removeRemaining();
}

function createLineGetter() {
    const lineEls = [...out.querySelectorAll('div')];
    console.log(lineEls);
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
        removeRemaining: () => {
            console.log('removing', lineEls.length)
            lineEls.forEach(el => out.removeChild(el));
        },
    };
}

function * toLines(key, obj, indentation = 0, prefix2 = '&nbsp;') {
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
