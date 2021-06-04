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
        const prefix = key ? `${key}: ` : '';
        yield ({ indentation, v: `${prefix2}${prefix}${JSON.stringify(obj)}` });    
        return;
    }
    key && (yield ({ indentation: indentation-1, v: `${key}:`, color: 'blue' }));
    if (Array.isArray(obj)) {
        for (const item of obj) {
            yield * toLines(undefined, item, indentation+1, prefix2);
        }
        return;
    }
    for (const [key, value] of Object.entries(obj)) {
        const valueType = typeof value;
        if (valueType === 'object') {
            if (Array.isArray(value)) {
                yield * toLines(key, value, indentation+1, '-');
            } else {
                yield * toLines(key, value, indentation+1);
            }
        } else {
            yield * toLines(key, value, indentation);
        }
    }
}
