new MyPromise((resolve) => resolve(123))
    .then(res => {console.log(1, res, 'expected: 123'); return res;})
    .finally(() => console.log('finally'))
    .then(res => {
        console.log(2, res, 'expected: 123');

        return new MyPromise(resolve => resolve(321))
            .then(r => {console.log(3, r, 'expected: 321'); return r;})
            .then(r => {console.log(4, r, 'expected: 321'); return r;});
    })
    .then(res => {console.log(5, res, 'expected: 321')})
    .then(() => {throw new Error(123)})
    .catch((e) => console.log('catched', e))
    .then((r) => console.log(r));

    
