"use strict";

var endTime = function (time, expr) {
    switch (expr.tag) {
    case 'note':
        return time + expr.dur;
    case 'reset':
        return time + expr.duration;
    case 'par':
        return time + Math.max(
            endTime(time, expr.left),
            endTime(time, expr.right)
        );
    case 'seq':
        return endTime(
            endTime(time, expr.left),
            expr.right
        );
    case 'repeat':
        return time + expr.count * endTime(time, expr.section);
    }
},

    convertPitch = function (pitch) {
        var match = pitch.match(/^([a-g])([0-8])$/i),
            letter = match[1].toLowerCase(),
            octave = match[2],
            letterPitch = {
                c: 0,
                d: 2,
                e: 4,
                f: 5,
                g: 7,
                a: 9,
                b: 11
            };

        return 12 + 12 * octave + letterPitch[letter];
    },

    compileHelper = function (expr, currentTime, compiled) {
        var i, time;

        switch (expr.tag) {
        case 'note':
            compiled.push({
                tag: 'note',
                pitch: convertPitch(expr.pitch),
                start: currentTime,
                dur: expr.dur
            });
            break;
        case 'rest':
            compiled.push({
                tag: 'rest',
                start: currentTime,
                dur: expr.duration
            });
            break;
        case 'par':
            compileHelper(
                expr.right,
                currentTime,
                compileHelper(expr.left, currentTime, compiled)
            );
            break;
        case 'seq':
            compileHelper(
                expr.right,
                endTime(currentTime, expr.left),
                compileHelper(expr.left, currentTime, compiled)
            );
            break;
        case 'repeat':
            time = currentTime;
            for (i = 0; i < expr.count; i = i + 1) {
                compileHelper(expr.section, time, compiled);
                time = endTime(time, expr.section);
            }
            break;
        }

        return compiled;
    },

    compile = function (musexpr) {
        return compileHelper(musexpr, 0, []);
    },

    test = function (musexpr) {
        console.log(musexpr);
        console.log(compile(musexpr));
        console.log();
    };


test(
    { tag: 'note', pitch: 'a4', dur: 250 }
);

test(
    { tag: 'seq',
        left: { tag: 'note', pitch: 'a4', dur: 250 },
        right: { tag: 'note', pitch: 'b4', dur: 250 } }
);

test(
    { tag: 'seq',
        left:
        { tag: 'seq',
            left: { tag: 'note', pitch: 'a4', dur: 250 },
            right: { tag: 'note', pitch: 'b4', dur: 250 } },
        right:
        { tag: 'seq',
            left: { tag: 'note', pitch: 'c4', dur: 500 },
            right: { tag: 'note', pitch: 'd4', dur: 500 } } }
);

test(
    { tag: 'par',
        left: { tag: 'note', pitch: 'a4', dur: 500},
        right: { tag: 'note', pitch: 'd4', dur: 500} }
);

test(
    { tag: 'par',
        left: { tag: 'note', pitch: 'c4', dur: 250 },
        right:
        { tag: 'par',
            left: { tag: 'note', pitch: 'e4', dur: 250 },
            right: { tag: 'note', pitch: 'g4', dur: 250 } } }
);

test(
    { tag: 'rest', duration: 100 }
);

test(
    { tag: 'repeat',
        section: { tag: 'note', pitch: 'c4', dur: 250 },
        count: 3 }
);
