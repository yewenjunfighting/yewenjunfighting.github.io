import React from 'react'
import $ from 'jquery'
import { updateBoxPos } from './box'

/**
 * function : 创建乌龟, 根据当前level中的tortoise对象的x, y设置left和top值, 进行决定定位
 * param : nowLevel 当前关卡数据 ; changePos 当它为true时,表示要对乌龟进行重定位,在用户点击再玩一次时传入true
 * */
export function createTortoise(nowLevel, changePos) {
    let pos = JSON.parse(window.sessionStorage.getItem('tortoise')) || nowLevel.tortoise
    let left = pos.x * 50;
    let top = pos.y * 50;
    if(changePos) {
        left = nowLevel.tortoise.x * 50;
        top = nowLevel.tortoise.y * 50;
        $('.tortoise').css('left', left);
        $('.tortoise').css('top', top);
    }else return (
        <div className="tortoise" style={{ left, top }}></div>
    )
}

/**
 * function : 为乌龟绑定keydown事件, 并根据键盘的上下左右改变乌龟朝向
 * param : none
 * return : none
 * */
export function bindTortoise(nowLevel, _this) {
    $(document).unbind(); // 解除先前绑定的keyDown事件,否则移动会出现跳步的情况
    let tortoise = $('.tortoise');
    let tort = JSON.parse(window.sessionStorage.getItem('tortoise'));
    tortoise.data('x', tort.x);
    tortoise.data('y', tort.y);
    $(document).keydown(function(event) {
        switch(event.which) { //
            case 37 : // 👈
                tortoise.css('backgroundPosition', '-150px 0 '); // 改变乌龟朝向
                walkTortoise.call(_this, tortoise, { x: -1 }, nowLevel); // 控制乌龟走动
                break;
            case 38 : // 👆
                tortoise.css('backgroundPosition', '0 0 ');
                walkTortoise.call(_this, tortoise, { y: -1 }, nowLevel);
                break;
            case 39 : // 👉
                tortoise.css('backgroundPosition', '-50px 0 ');
                walkTortoise.call(_this, tortoise, { x: 1 }, nowLevel);
                break;
            case 40 : // 👇
                tortoise.css('backgroundPosition', '-100px 0 ');
                walkTortoise.call(_this, tortoise, { y: 1 }, nowLevel);
                break;
            default : break;
        }
    })
}

/**
 * function : 控制乌龟移动
 * param: tortoise: 乌龟, walk: 移动时所在行或者列的改变, nowLevel : 当前关卡数据
 * return none
 * */
function walkTortoise(tortoise, walk, nowLevel) { // 乌龟移动
    let walkX = walk.x || 0; // 传下来的walk中只有x或者只有y, 如果没有的值就为0, 那么就不会对位置产生影响
    let walkY = walk.y || 0;
    let rowNum = Math.sqrt(nowLevel.map.length); // map每行的格子个数
    let kind = nowLevel.map[(tortoise.data('y') + walkY) * rowNum + tortoise.data('x') + walkX]; // 取出乌龟移动方向上前一位的值
    if(kind !== 2) { // 如果不是墙, 就移动乌龟到目标位
        tortoise.data('y', tortoise.data('y') + walkY); // 设置乌龟的坐标
        tortoise.data('x', tortoise.data('x') + walkX);
        // 修改乌龟的位置
        storeTortoisePos({x: tortoise.data('x'), y: tortoise.data('y')});
        tortoise.css('top', tortoise.data('y') * 50); // 移动乌龟
        tortoise.css('left', tortoise.data('x') * 50);

        $('.box').each($.proxy(function(i, elem) { // 检测乌龟是否碰到了box
            if(impactCheck(tortoise, $(elem))) { // 如果碰上box了, 那么当前乌龟的位置和某个box的位置是相同的, 接下来就看这个box是否可以往乌龟来的那个方向移动
                kind = nowLevel.map[(tortoise.data('y') + walkY) * rowNum + tortoise.data('x') + walkX]; // 取出乌龟往先前方向再次移动后的值
                if(kind !== 2) { // 如果没有碰到墙, 也就是说乌龟碰到的那个箱子可以往指定方向移动, 就改变箱子的left和top, 就相当于把在乌龟身上干做过的,在box身上再做一次, 让box移动
                    $(elem).css('left', (tortoise.data('x') + walkX) * 50); // 我们先把elem移动, 如果箱子前面还有箱子的话,那么两个箱子就会重叠在一起，针对这种情况,下面会有解决的方法
                    $(elem).css('top', (tortoise.data('y') + walkY) * 50);
                    // 更新box的位置
                    updateBoxPos(i, tortoise.data('x') + walkX, tortoise.data('y') + walkY);
                    $('.box').each($.proxy(function(j, Elem ){ // 对刚才移动的那个box再做一次碰撞检测(这里要注意只有真正的移动了才可以做碰撞检测),如果有碰撞(排除自身的干扰),就撤回刚才对box的移动
                        if(elem !== Elem && impactCheck($(elem), $(Elem))) { //如果elem移动到另一个box上, 那么根据规则,乌龟是推不动箱子的, 那么就要让elem和乌龟回到原来的位置上
                            $(elem).css('left', (tortoise.data('x')) * 50); // 把box移动到乌龟所在的位置, 也就是回到原来的位置
                            $(elem).css('top', (tortoise.data('y')) * 50);
                            // 更新box的位置
                            updateBoxPos(i, tortoise.data('x'), tortoise.data('y'));
                            tortoise.data('y', tortoise.data('y') - walkY); // 重新设置乌龟的坐标
                            tortoise.data('x', tortoise.data('x') - walkX);
                            // 重新设置tortoise的位置
                            storeTortoisePos({x: tortoise.data('x'), y: tortoise.data('y')});
                            tortoise.css('top', tortoise.data('y') * 50);   // 把乌龟移动到原来的位置
                            tortoise.css('left', tortoise.data('x') * 50);
                        }
                    }, this));

                }else { // 如果box按乌龟移动的方向移动会遇到墙, 就撤回乌龟的移动，回到原位置
                    tortoise.data('y', tortoise.data('y') - walkY);
                    tortoise.data('x', tortoise.data('x') - walkX);
                    //把乌龟撤回来
                    storeTortoisePos({x: tortoise.data('x'), y: tortoise.data('y')});
                    tortoise.css('top', tortoise.data('y') * 50);
                    tortoise.css('left', tortoise.data('x') * 50);
                }
            }
        }, this));
    }

    // 检测是否该进入下一关
    if(nextLevel()) {
        $(document).unbind();
        this.setState((state)=>{
           return {
               success: !state.success
           }
        });
    }
}

/**
 * function : 碰撞检测
 * param : elem1 元素一, elem2 元素二
 * return : none
 * */
function impactCheck(elem1, elem2) {
    // offset()返回元素的偏移量
    let left1 = elem1.offset().left;
    let right1 = elem1.offset().left + elem1.width();
    let top1 = elem1.offset().top;
    let bottom1 = elem1.offset().top + elem1.height();

    let left2 = elem2.offset().left;
    let right2 = elem2.offset().left + elem2.width();
    let top2 = elem2.offset().top;
    let bottom2 = elem2.offset().top + elem2.height();

    return !(left1 >= right2 || right1 <= left2 || top1 >= bottom2 || bottom1 <= top2);
}

/**
 * function : 判断是否成功,成功了就进入下一关
 * param : none
 * return : none
 * */
function nextLevel() {
    let numberOfCoincidences = 0;
    $('.target').each($.proxy(function(i, elem){ // 如果目标位置被box全部占满就通关成功
        $('.box').each($.proxy(function(j, Elem){
            if($(elem).offset().top === $(Elem).offset().top && $(elem).offset().left === $(Elem).offset().left) {
                numberOfCoincidences ++;
            }
        }, this));
    }, this));
    if(numberOfCoincidences === $('.target').length) {
        return true;
    }else return false;
}

/**
 * @param pos 乌龟的位置
 * */

export function storeTortoisePos(pos) {
    window.sessionStorage.setItem('tortoise', JSON.stringify(pos))
}
