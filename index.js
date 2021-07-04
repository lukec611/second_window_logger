const delay = ms => new Promise(r => setTimeout(r, ms));


async function main() {
    const popUpWindow = window.open('./second_window_logger.html', '_blank', 'height=500,width=500');

    await new Promise(r => setTimeout(r, 500));
    
    const hobbies = ['cooking', 'brunch', 'dirt bike'];
    const bad = {
        hobbies: [
            'programming',
            'art',
            'creating things',
            ['w1', 'w2'],
        ],
    }

    for (let i = 0; i < 2; i++) {
        await(delay(700));
        const v ={
            type: 'json',
            value: {
                name: 'luke',
                age: 30 + i,
                nothing: [],
                bad: {
                    ...(i % 2 === 0 ? {} : bad),
                },
                yay: [
                    { a: true, name: 'a' },
                    { b: false, name: 'b' },
                ],
                favColor: '#ff0000',
            },
        };
        popUpWindow.postMessage(v);
    }

}

main();
