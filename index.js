const delay = ms => new Promise(r => setTimeout(r, ms));


async function main() {
    const popUpWindow = window.open('./second_window_logger.html', '_blank', 'height=500,width=500');

    await delay(1000);

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
                favColor: '#ff0000',
                details: {
                    lastName: 'lincoln',
                    isMarried: true,
                    likesBlackOlives: false,
                },
            },
        };
        popUpWindow.postMessage(v);
    }

}

main();
