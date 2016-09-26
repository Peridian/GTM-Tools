module.exports = {
    data: data => { console.log('\n\n' + data + '\n\n') }
    , empty: data => { throw '\n\nError: No ' + data.kind.split('#').pop() + ' to be found...\n\n' }
    , entering: data => {
        var item = data.items[0];
        console.log('\n\n- Entering ' + item.kind.split('#').pop() + ' "' + item.name + '"...\n\n')
        return item.id;
    }
    , choose: data => {

        var asdf = Object.keys(data)[0].slice(0, -1)
        console.log('asdf')
        console.log(asdf)
        console.log('\n')
        try {
            var kind = data.items[0].kind.split('#').pop() || asdf;
        } catch (e) { console.log(e) }

        console.log('kind')
        console.log(kind)
        console.log('\n')

        kind = 'aeiou'.indexOf(kind[0].toLowerCase()) !== -1
            ? 'n ' + kind
            : ' ' + kind
            ;

        message = '\nError: Please, choose a' + kind + ':\n'
            + data.items.map(function (e, i, a) {
                return '"' + i + '" for "' + e.name + '"'
            }).join('\n ')
            + '\n'
            ;

        throw new Error(message);
    }
}