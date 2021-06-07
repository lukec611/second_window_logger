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

function renderJson(obj) {
    out.innerHTML = '';
    out.style.fontFamily = 'monospace';
    for (const { indentation, v, color } of toLines(undefined, obj)) {
        const lineEl = document.createElement('div');
        lineEl.style.paddingLeft = `${indentation*16}px`;
        color && (lineEl.style.color = color);
        out.appendChild(lineEl);
        lineEl.innerHTML = v;
    }
}

function * toLines(key, obj, indentation = 0, prefix2 = '') {
    if (typeof obj !== 'object') {
        const prefix = key ? `${colorit(key, 'blue')}: ` : '';
        yield ({ indentation, v: `${prefix2}${prefix}${colorVal(obj)}` });    
        return;
    }
    key && (yield ({ indentation: indentation-1, v: `${colorit(key, 'blue')}:` }));
    if (Array.isArray(obj)) {
        for (const item of obj) {
            yield * toLines(undefined, item, indentation, prefix2);
        }
        return;
    }
    for (const [key, value] of Object.entries(obj)) {
        const valueType = typeof value;
        if (valueType === 'object') {
            if (Array.isArray(value)) {
                if (value.length)
                    yield * toLines(key, value, indentation+1, '-');
                else {
                    const prefix = key ? `${colorit(key, 'blue')}: ` : '';
                    yield ({ indentation, v: `${prefix2}${prefix}${colorVal(value)}` });    
                }
            } else {
                yield * toLines(key, value, indentation+1);
            }
        } else {
            yield * toLines(key, value, indentation);
        }
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
