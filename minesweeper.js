/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, jquery:true, indent:4, maxerr:50 */
$(function () {
    "use strict";
    // Board contains a 2D array of booleans, indicating the presence of mines.
    var board,
        clicked,
        height,
        width,
        mines,
        flags,
        remainingEmptyCells,
        tableCells,
        primaryButtonDepressed,
        secondaryButtonDepressed,
        clockInterval;

    // This initializes the board and places a number of mines uniformly at random.
    function initBoard(width, height, mines) {
        var row,
            col,
            board = [],
        // What is the probability that the current cell should contain a mine?
            p,
            remaining = mines;
        // TODO(jrgfogh): Don't initialize clicked destructively.
        remainingEmptyCells = width * height - mines;
        clicked = [];
        for (row = 0; height > row; ++row) {
            board.push([]);
            clicked.push([]);
            for (col = 0; width > col; ++col) {
                p = remaining / (width * height - row * width - col);
                // Should we place a mine here?
                if (Math.random() < p) {
                    --remaining;
                    board[row].push(true);
                } else {
                    board[row].push(false);
                }
                clicked[row].push(false);
            }
        }
        return board;
    }

    function outsideBoardMouseUp(event) {
        switch (event.which) {
        case 1:
            primaryButtonDepressed = false;
            break;
        case 2:
            primaryButtonDepressed = false;
            secondaryButtonDepressed = false;
            break;
        case 3:
            secondaryButtonDepressed = false;
            break;
        }
    }

    // TODO(jrgfogh): Combine this with neighboringMines, since they are almost identical.
    function neighboringFlags(row, col) {
        var neighborRow,
            neighborCol,
            neighborCount = 0;
        for (neighborRow = Math.max(0, row - 1); Math.min(board.length, row + 2) > neighborRow; ++neighborRow) {
            for (neighborCol = Math.max(0, col - 1); Math.min(board[neighborRow].length, col + 2) > neighborCol; ++neighborCol) {
                if (tableCells[neighborRow][neighborCol].hasClass('flag')) {
                    ++neighborCount;
                }
            }
        }
        return neighborCount;
    }

    function neighboringMines(row, col) {
        var neighborRow,
            neighborCol,
            neighborCount = 0;
        for (neighborRow = Math.max(0, row - 1); Math.min(board.length, row + 2) > neighborRow; ++neighborRow) {
            for (neighborCol = Math.max(0, col - 1); Math.min(board[neighborRow].length, col + 2) > neighborCol; ++neighborCol) {
                if (board[neighborRow][neighborCol]) {
                    ++neighborCount;
                }
            }
        }
        return neighborCount;
    }

    function clickSurroundingCells(row, col) {
        var neighborRow,
            neighborCol;
        for (neighborRow = Math.max(0, row - 1); Math.min(board.length, row + 2) > neighborRow; ++neighborRow) {
            for (neighborCol = Math.max(0, col - 1); Math.min(board[neighborRow].length, col + 2) > neighborCol; ++neighborCol) {
                if (neighborRow !== row ||
                    neighborCol !== col) {
                    primaryClickCell(neighborRow, neighborCol);
                }
            }
        }
    }

    function endGame() {
        // Mark all the cells as clicked to stop the game.
        var row,
            col;
        for (row = 0; board.length > row; ++row) {
            for (col = 0; board[row].length > col; ++col) {
                clicked[row][col] = true;
            }
        }
        pauseClock();
    }

    function showMines(className) {
        var row,
            col,
            rowDelay;
        for (row = 0; board.length > row; ++row) {
	    rowDelay = 200 * (board.length - row - 1);
            for (col = 0; board[row].length > col; ++col) {
                tableCells[row][col].delay(rowDelay).queue(function(next) {
                    $(this).addClass(className);
                    next();
                });
                if (!board[row][col]) {
                    tableCells[row][col].delay(200).queue(function(next) {
			$(this).removeClass(className);
			next();
                    });
		}
            }
        }        
    }

    function gameWon() {
        endGame();
        // TODO(jrgfogh): Do something better here.
        showMines('defused');
    }

    function gameOver(row, col) {
        endGame();
        // TODO(jrgfogh): Do something better here.
        tableCells[row][col].addClass('mine');
        showMines('mine');
    }

    function pauseClock() {
        clearInterval(clockInterval);
    }

    function unpauseClock() {
        // TODO(jrgfogh): Stub!
    }

    function startClock() {
        var startTime = new Date().getTime();
        clearInterval(clockInterval);
        clockInterval = setInterval(function () {
            var now = new Date().getTime();
            $('#clock').text(Math.floor((now - startTime) / 1000));
        }, 200);
    }

    function newGame() {
        $('#board').empty();
        board = initBoard(width, height, mines);
        flags = 0;
        updateFlagCounter();
        $('#board').prepend(renderBoard(board));
        startClock();
    }

    function updateFlagCounter() {
        $('#flag_counter').text(flags + '/' + mines);
    }

    function primaryClickCell(row, col) {
        var neighbors,
            numbers = {
                1: 'one',
                2: 'two',
                3: 'three',
                4: 'four',
                5: 'five',
                6: 'six',
                7: 'seven',
                8: 'eight',
                9: 'nine',
                0: 'zero'
            };
        if (!clicked[row][col] && !tableCells[row][col].hasClass('flag')) {
            clicked[row][col] = true;
            tableCells[row][col].addClass('clicked');
            // Check for a mine.
            if (board[row][col]) {
                gameOver(row, col);
            } else {
                --remainingEmptyCells;
                neighbors = neighboringMines(row, col);
                tableCells[row][col].addClass(numbers[neighbors]);
                if (0 === neighbors) {
                    clickSurroundingCells(row, col);
                } else {
                    tableCells[row][col].text(neighbors);
                }
                if (0 === remainingEmptyCells) {
                    gameWon();
                }
            }
        }
    }

    function middleClickCell(row, col) {
        if (clicked[row][col]) {
            if (neighboringFlags(row, col) === neighboringMines(row, col)) {
                clickSurroundingCells(row, col);
            }
        }
    }

    function secondaryClickCell(row, col) {
        if (!clicked[row][col]) {
            if (tableCells[row][col].hasClass('flag')) {
                --flags;
            } else {
                ++flags;
            }
            updateFlagCounter();
            tableCells[row][col].toggleClass('flag');
        }
    }

    function setLevelBeginner() {
        height = 10;
        width = 10;
        mines = 15;
        newGame();
    }

    function setLevelIntermediate() {
        height = 15;
        width = 15;
        mines = 50;
        newGame();
    }

    function setLevelExpert() {
        height = 20;
        width = 30;
        mines = 99;
        newGame();
    }

    function setLevel() {
        switch ($(this).val()) {
        case "beginner":
            setLevelBeginner();
            break;
        case "intermediate":
            setLevelIntermediate();
            break;
        case "expert":
            setLevelExpert();
            break;
        }
    }

    function depressNeighboringCells(row, col) {
        var neighborRow,
            neighborCol,
            neighborCount = 0;
        for (neighborRow = Math.max(0, row - 1); Math.min(board.length, row + 2) > neighborRow; ++neighborRow) {
            for (neighborCol = Math.max(0, col - 1); Math.min(board[neighborRow].length, col + 2) > neighborCol; ++neighborCol) {
                tableCells[neighborRow][neighborCol].addClass('depressed');
            }
        }
    }

    function depressCells(row, col) {
        $('.depressed').removeClass('depressed');
        if (primaryButtonDepressed && secondaryButtonDepressed) {
            depressNeighboringCells(row, col);
        } else if (primaryButtonDepressed) {
            tableCells[row][col].addClass('depressed');
        }
    }

    function renderBoard(board) {
        var table = $('<table>'),
            row,
            col,
            tr,
            td;
        tableCells = [];

        function cellDownFunction(row, col) {
            return function (event) {
                switch (event.which) {
                case 1:
                    primaryButtonDepressed = true;
                    break;
                case 2:
                    // TODO(jrgfogh): Use a separate flag for this, in case several buttons are pressed.
                    primaryButtonDepressed = true;
                    secondaryButtonDepressed = true;
                    break;
                case 3:
                    secondaryButtonDepressed = true;
                    break;
                }
                depressCells(row, col);
                if (!primaryButtonDepressed && secondaryButtonDepressed) {
                    secondaryClickCell(row, col);
                }
            };
        }

        function cellUpFunction(row, col) {
            return function(event) {
                if (primaryButtonDepressed && secondaryButtonDepressed) {
                    middleClickCell(row, col);
                } else if (primaryButtonDepressed) {
                    primaryClickCell(row, col);
                }
                outsideBoardMouseUp(event);
                depressCells(row, col);
                return false;
            };
        }

        function cellMoveFunction(row, col) {
            return function() {
                depressCells(row, col);
            };
        }

        for (row = 0; board.length > row; ++row) {
            tableCells.push([]);
            tr = $('<tr>');
            for (col = 0; board[row].length > col; ++col) {
                td = $('<td class="cell">&nbsp;</td>');
                td.mousedown(cellDownFunction(row, col));
                td.mouseup(cellUpFunction(row, col));
                td.mousemove(cellMoveFunction(row, col));
                tableCells[row].push(td);
                tr.append(td);
            }
            table.append(tr);
        }
        return table;
    }

    // Disable the context menu when secondary-clicking.
    $('#board').contextmenu(function () {
        return false;
    });

    $('input[name=level]').change(setLevel);
    $('#beginner').attr('checked', 'checked');
    setLevelBeginner();
    $('button.new_game').click(newGame);
    $('body').mouseup(outsideBoardMouseUp).
        // In some scenarios we can't catch the mouseup event.
        // This is a hack to work around that.
        mousemove(function(event) {
                if (0 === event.which) {
                    primaryButtonDepressed = false;
                    secondaryButtonDepressed = false;
                }
        });
});
