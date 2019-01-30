/**
SEEK:
- load test page
- load stream
- check playing status
- get stream duration (player.getDuration())
- repeat N times:
    - seek at a random position (player.seek())
    - check if playback is seeked at new position
    - check if playback is progressing
**/
define([
    'intern',
    'intern!object',
    'intern/chai!assert',
    'require',
    'test/functional/tests/scripts/player',
    'test/functional/tests/scripts/utils'
], function(intern, registerSuite, assert, require, player, utils) {

    // Suite name
    var NAME = 'TEST_SEEK';

    // Test constants
    var PLAYING_TIMEOUT = 10; // Timeout (in sec.) for checking playing status
    var PROGRESS_VALUE = 5; // Playback progress value (in sec.) to be checked
    var PROGRESS_TIMEOUT = 10; // Timeout (in sec.) for checking playback progress
    var SEEK_TIMEOUT = 5; // Timeout (in sec.) for checking seek to be completed
    var SEEK_COUNT = 1; // Number of seek tests

    // Test variables
    var seekPos;

    var generateSeekPos = function(duration) {
        var pos = Math.round(Math.random() * duration * 100) / 100;
        if (pos > (duration - PROGRESS_VALUE)) {
            pos -= PROGRESS_VALUE;
        }
        if (pos < PROGRESS_VALUE) {
            pos += PROGRESS_VALUE;
        }
        return pos;
    };
    
    var load = function(stream) {
        registerSuite({
            name: NAME,

            load: function() {
                if (!stream.available) {
                    this.skip();
                }
                utils.log(NAME, 'Setup');
                command = this.remote.get(require.toUrl(intern.config.testPage));
                return command.execute(player.loadStream, [stream])
                .then(function() {
                    // Check if playing
                    utils.log(NAME, 'Check if playing');
                    return command.executeAsync(player.isPlaying, [PLAYING_TIMEOUT]);
                })
                .then(function(playing) {
                    assert.isTrue(playing);
                });
            }
        })
    };

    var seek = function(stream) {
        registerSuite({
            name: NAME,

            seek: function() {
                if (!stream.available) {
                    this.skip();
                }
                // Get the stream duration (applies for static and dynamic streams)
                return command.execute(player.getDuration)
                .then(function(duration) {
                    utils.log(NAME, 'Duration: ' + duration);
                    // Generate randomly a seek position
                    seekPos = generateSeekPos(duration);
                    utils.log(NAME, 'Seek: ' + seekPos);
                    // Seek the player
                    return command.executeAsync(player.seek, [seekPos, SEEK_TIMEOUT]);
                })
                .then(function(seeked) {
                    assert.isTrue(seeked);
                    // Check if correctly seeked
                    return command.execute(player.getTime);
                })
                .then(function(time) {
                    utils.log(NAME, 'Playback time: ' + time);
                    return assert.isAtLeast(time, seekPos);
                });
            },

            playing: function() {
                if (!stream.available) {
                    this.skip();
                }
                utils.log(NAME, 'Check if playing');
                return command.executeAsync(player.isProgressing, [PROGRESS_VALUE, PROGRESS_TIMEOUT])
                .then(function(progressing) {
                    return assert.isTrue(progressing);
                });
            }
        });
    };

    return {
        register: function (stream) {
            load(stream);
            for (var i = 0; i < SEEK_COUNT; i++) {
                seek(stream);
            }
        }
    }

});
