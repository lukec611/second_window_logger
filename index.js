const delay = ms => new Promise(r => setTimeout(r, ms));


async function main() {
    const popUpWindow = window.open('./second_window_logger.html', '_blank', 'height=500,width=500');

    await new Promise(r => {
        popUpWindow.addEventListener('message', (evt) => {
            if (evt.data === 'ready') r();
        });
    });
    
    const hobbies = ['cooking', 'brunch', 'dirt bike'];

    for (let i = 0; i < 100; i++) {
        await(delay(700));
        const v ={
            type: 'json',
            value: {
                name: 'luke',
                age: 30 + i,
                hobbies: [
                    'programming',
                    'art',
                    'creating things',
                    ['w1', 'w2'],
                    hobbies[i % hobbies.length],
                ],
                nothing: [],
                yay: [
                    { a: true, name: 'a' },
                    { b: false, name: 'b' },
                ],
                favColor: '#ff0000',
                details: {
                    lastName: 'lincoln',
                    isMarried: true,
                    likesBlackOlives: false,
                },
                mp: new Map([
                    ['doc', 'var'],
                    ['biff', i * 100],
                    ['marty', i % 2 === 0],
                ]),
                np: new Map(),
            },
        };
        popUpWindow.postMessage(v);
    }

}

main();
