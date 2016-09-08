module.exports = {
    filename: ''
    , start: function (filename) {
        this.filename = filename

        console.log('\n');
        console.log('-----');
        console.log(this.filename + ' - execution START')
        console.log('-----');
        console.log('\n');
    }
    , end: function (filename) {
        console.log(this.filename + ' - execution END')
        console.log('\n');
    }
}