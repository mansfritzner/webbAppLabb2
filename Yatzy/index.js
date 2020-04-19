const store = new Vuex.Store({
    state: {
        dice: [],
        scoreCard: [],
        rollsLeft: 3,
        activeItem: [],
        playedItems: [],
        rollingInProgress: false,
        animation: false

    },
    getters: {
        activeItemId: (state, getters) => {
            if (getters.activeItemExists) return state.activeItem[0].id;
            else return -1;
        },
        activeItemExists: state => {
            if (state.activeItem.length > 0) return true;
            else return false;
        },
        diceValues: state => {
            results = [];
            state.dice.forEach(d => {
                results.push(d.value);
            });
            return results;
        },
        checkEndGame: state => {
            return state.playedItems.length === 15 ? true : false;
        },
        sortByDesDice: (state, getters) => {
            let sortedArray = [];
            sortedArray = getters.diceValues.slice().sort(function(a, b) {
                return b - a;
            });
            return sortedArray;
        },
        sortByAscDice: (state, getters) => {
            let sortedArray = [];
            sortedArray = getters.diceValues.slice().sort(function(a, b) {
                return a - b;
            });
            return sortedArray;
        },
        calculateAggregate: (state, getters) => {
            let aggregate = [];
            let current = null;
            let cnt = 0;

            for (let i = 0; i <= getters.sortByDesDice.length; i++) {
                if (getters.sortByDesDice[i] != current) {
                    if (cnt > 0) {
                        aggregate.push({ number: current, count: cnt });
                    }
                    current = getters.sortByDesDice[i];
                    cnt = 1;
                } else {
                    cnt++;
                }
            }
            return aggregate;
        },
        calculateNumbers: (state, getters) => num => {
            let sum = 0;
            let aggregateObj = { number: num, count: 0 };
            let temp = {};
            temp = getters.calculateAggregate.find(d => d.number === num);
            if (typeof temp != "undefined") aggregateObj = temp;
            sum = aggregateObj.number * aggregateObj.count;
            return sum;
        },
        scoreCardValues: state => {
            let results = [];
            state.scoreCard.forEach(s => {
                results.push(s.value);
            });
            return results;
        },
        calculateTotalScore: (state, getters) => {
            if (getters.scoreCardValues.length != 0)
                result = getters.scoreCardValues.reduce(
                    (partial_sum, a) => partial_sum + a
                );

            return result;
        },
    },
    mutations: {
        initScoreCard(state) {
            let fieldArray = [
                "ettor",
                "tvåor",
                "treor",
                "fyror",
                "femmor",
                "sexor",
            ];
            for (let index = 0; index < fieldArray.length; index++) {
                let indexPlusOne = index + 1;
                if (
                    fieldArray[index] === "bonus" ||
                    fieldArray[index] === "del-summa" ||
                    fieldArray[index] === "info"
                ) {
                    state.scoreCard.push({
                        id: indexPlusOne,
                        field: fieldArray[index],
                        value: 0,
                        locked: true,
                        unlockable: false,
                        selectable: false
                    });
                } else {
                    state.scoreCard.push({
                        id: indexPlusOne,
                        field: fieldArray[index],
                        value: 0,
                        locked: false,
                        unlockable: true,
                        selectable: true
                    });
                }
            }
        },
        initDice(state) {
            for (let index = 0; index < 5; index++) {
                state.dice.push({
                    id: index,
                    value: 0,
                    locked: false
                });
            }
        },

        changeDieValue(state, payload) {
            state.dice[payload.index].value = payload.value;
        },

        toggleLockDice(state, payload) {
            let index = state.dice.findIndex(x => x.id === payload);
            if (state.dice[index].value != 0 && state.rollingInProgress === false)
                state.dice[index].locked = !state.dice[index].locked;
        },

        setScoreAndLock(state, payload) {

            if (state.activeItem.length === 0) {
                state.scoreCard[payload.index].value = payload.value;
                state.scoreCard[payload.index].locked = true;
                state.activeItem.push(state.scoreCard[payload.index]);

            }
        },
        unlockItem(state, payload) {
            if (
                state.activeItem[0].id === state.scoreCard[payload].id &&
                state.scoreCard[payload].unlockable === true
            ) {
                state.scoreCard[payload].locked = false;
                state.scoreCard[payload].value = 0;
                state.activeItem.pop();
            }
        },
        pushToPlayedItems(state) {
            if (state.activeItem.length > 0) {
                state.playedItems.push(state.activeItem[0]);
            }
        },
        popActiveItem(state) {
            state.activeItem.pop();
        },
        restoreRollsLeft(state) {
            state.rollsLeft = 3;
        },
        decrementRollsLeft(state) {
            if (state.rollsLeft > 0) state.rollsLeft--;
        },
        toggleAnimation(state) {
            state.animation = !state.animation;
        },
        resetDice(state) {
            state.dice.forEach(d => {
                d.value = 0;
                d.locked = false;
            });
        }
    },
    actions: {
        rollDice({ commit, state, getters }) {
            if (state.rollsLeft > 0) {
                if (getters.activeItemExists) {
                    commit("unlockItem", state.activeItem[0].id - 1);
                }
                state.dice.forEach(d => {
                    if (!d.locked) {
                        state.rollingInProgress = true;
                        var i = 0;
                        var id = setInterval(frame, 0);
                        function frame() {
                            if (i == 7) {
                                clearInterval(id);
                                state.rollingInProgress = false;
                            } else {
                                commit("changeDieValue", {
                                    index: d.id,
                                    value: Math.floor(Math.random() * 6) + 1
                                });
                                i++;
                            }
                        }
                    }
                });

                commit("decrementRollsLeft");
            }
        },
        nextRound({ state, commit, getters, dispatch }) {
            if (getters.activeItemExists) {
                commit("resetDice");
                commit("deepLock");
                commit("pushToPlayedItems");
                commit("popActiveItem");
                commit("restoreRollsLeft");
                if (getters.checkEndGame) {
                    dispatch("presentVictoryScreen");
                }
            }
        },
    }
});
const Header = {
    computed: {
        scoreCard() {
            return this.$store.state.scoreCard;
        },
        totalScore() {
            return this.$store.getters.calculateTotalScore;
        }
    },
    template: `<div class="cbvl cb1">Yatzy Totala Poäng: {{totalScore}} 
      </div>`
};
const HeaderMobile = {
    computed: {
        scoreCard() {
            return this.$store.state.scoreCard;
        },
        totalScore() {
            return this.$store.getters.calculateTotalScore;
        }
    },
    template: `<div class="header">
  <div class="cbvl cb1">Poäng: {{totalScore}}</div>
  <p class="nav">

  </p>
      </div>`
};

const Victory = {
    computed: {
        totalScore() {
            return this.$store.getters.calculateTotalScore;
        }
    },

    template: `<div>
  <div class="victory">
      </div>
      </div>`
};


const Sidebar = {
};

const Die = {
    props: ["di"],
    store,
    computed: {
        id() {
            return this.di.id;
        },
        classObject() {
            let idPlusOne = this.di.id + 1;
            if (!this.di.locked && store.state.rollsLeft === 3)
                return "di " + "di" + idPlusOne;
            else if (store.state.rollingInProgress && !this.di.locked)
                return "di " + "di" + idPlusOne;
            else if (!this.di.locked && this.$store.state.animation === false)
                return "blink-infinite pointer di " + "di" + idPlusOne;
            else if (!this.di.locked && this.$store.state.animation === true)
                return "blink-infinite-two pointer di " + "di" + idPlusOne;
            else return "di orange-background pointer " + "di" + idPlusOne;
        },
        getDieUnicode() {
            if (this.di.value === 1) return "&#9856;";
            else if (this.di.value === 2) return "&#9857;";
            else if (this.di.value === 3) return "&#9858;";
            else if (this.di.value === 4) return "&#9859;";
            else if (this.di.value === 5) return "&#9860;";
            else if (this.di.value === 6) return "&#9861;";
            else return "";
        }
    },
    methods: {
        toggleLockDice(id) {
            if (this.di.locked === true) {
                store.commit("toggleAnimation");
            }
            store.commit("toggleLockDice", id);
        }
    },

    template: `<div v-bind:class="classObject" v-html="getDieUnicode" v-on:click="toggleLockDice(id)">
  </div>
      `
};
const DiceHolder = {
    computed: {
        dice() {
            return this.$store.state.dice;
        }
    },
    template: `
    <div class="dice-holder">
            <die v-for="d in dice" v-bind:di="d" :key="d.id"></die>
        </div>
    `,
    components: {
        die: Die
    }
};
const Item = {
    props: ["it"],
    store,
    computed: {
        classObject: function() {
            if (this.isInfo) {
                return "rr " + "rw" + this.it.id;
            } else return "rw " + "rw" + this.it.id;
        },
        classObjectSubItem: function() {
            if (!this.isInfo && this.getRollsLeft === 3 && this.it.locked === true) {
                return "vl";
            } else if (
                !this.isInfo &&
                this.getRollsLeft === 3 &&
                this.it.locked === false
            )
                return "vl bold orange";
            else if (
                !this.isInfo &&
                this.it.locked === false &&
                this.rollingInProgress === true
            )
                return "vl bold orange pointer";
            else if (
                !this.isInfo &&
                this.it.locked === false &&
                this.rollingInProgress === false &&
                this.$store.state.animation === false
            )
                return "vl bold orange blink-infinite pointer";
            else if (
                !this.isInfo &&
                this.it.locked === false &&
                this.rollingInProgress === false &&
                this.$store.state.animation === true
            )
                return "vl bold orange blink-infinite-two pointer";
            else if (!this.isInfo && this.it.selectable === false) return "vl";
            else if (!this.isInfo && this.it.unlockable === false) return "vl";
            else if (!this.isInfo && this.it.locked === true)
                return "vl orange-background pointer";
        },
        displayScore() {
            if (this.$store.state.rollingInProgress && this.$store.state.scoreCard[this.it.id-1].selectable === true)
                return this.$store.state.scoreCard[this.it.id-1].value;
            if (this.$store.state.scoreCard[this.it.id-1].locked === false || this.$store.state.scoreCard[this.it.id-1].selectable === false){
                switch (this.it.field) {
                    case "ettor" : return this.calculateNumbersOne
                    case "tvåor" : return this.calculateNumbersTwo
                    case "treor" : return this.calculateNumbersThree
                    case "fyror" : return this.calculateNumbersFour
                    case "femmor" :return this.calculateNumbersFive
                    case "sexor" : return this.calculateNumbersSix
                    default: return 0
                }

            } else
                return this.$store.state.scoreCard[this.it.id-1].value;
        },
        activeItemId() {
            return this.$store.getters.activeItemId;
        },
        activeItemExists() {
            return this.$store.getters.activeItemExists;
        },
        calculateNumbersOne() {
            return this.$store.getters.calculateNumbers(1);
        },
        calculateNumbersTwo() {
            return this.$store.getters.calculateNumbers(2);
        },
        calculateNumbersThree() {
            return this.$store.getters.calculateNumbers(3);
        },
        calculateNumbersFour() {
            return this.$store.getters.calculateNumbers(4);
        },
        calculateNumbersFive() {
            return this.$store.getters.calculateNumbers(5);
        },
        calculateNumbersSix() {
            return this.$store.getters.calculateNumbers(6);
        },
        calculateTotalScore() {
            return this.$store.getters.calculateTotalScore;
        },
        getRollsLeft() {
            return this.$store.state.rollsLeft;
        },
        isInfo() {
            return this.it.field === "info" ? true : false;
        },
        rollingInProgress() {
            return this.$store.state.rollingInProgress;
        }
    },
    methods: {
        toggleLockToScoreCard() {
            store.commit("toggleAnimation");
            if (this.getRollsLeft != 3 && this.rollingInProgress === false) {
                if (this.activeItemExists && this.activeItemId != this.it.id) {
                    let index = this.activeItemId - 1;
                    store.commit("unlockItem", index);
                }
                if (this.$store.state.scoreCard[this.it.id - 1].locked === false) {
                    let payload = { index: this.it.id - 1, value: this.displayScore };
                    store.commit("setScoreAndLock", payload);
                } else if (this.activeItemExists && this.activeItemId === this.it.id) {
                    let index = this.activeItemId - 1;
                    store.commit("unlockItem", index);
                }
            }
        }
    },

    template: `
         <div v-bind:class="classObject" v-on:click="toggleLockToScoreCard">
          <div v-if="!isInfo" class="fi">{{it.field}}</div>
          <div v-else-if="isInfo">Få 63p i den här kolumnen för att få en extra 50p bonus!</div>
 
          <div v-if="!isInfo" v-bind:class="classObjectSubItem">{{displayScore}}</div>
          
          
          </div>
      `
};

Vue.component("scoreCard", {
    computed: {
        dice() {
            return this.$store.state.dice;
        },
        scoreCard() {
            return this.$store.state.scoreCard;
        }
    },
    template: `
        <div class="score-card">
        <div class="cbvl cb1">Tryck på tärningarna för att låsa dem.</div>
        <div class="cbvl vl1"> efter 3 slag lås in det poäng där du vill</div>
        <div class="cbvl cb2"></div>
        <div class="cbvl vl2"></div>
        <item-selector v-for="i, index in scoreCard" v-bind:it="i" :key="index"></item-selector>
        </div>    
    `,
    components: {
        "item-selector": Item
    }
});
const Actions = {
    store,
    computed: {
        getRollsLeft() {
            return this.$store.state.rollsLeft;
        },
        activeItemExists() {
            if (this.$store.state.activeItem.length > 0) return true;
            else return false;
        },
        ahOneSlot() {
            if (
                !this.activeItemExists ||
                this.getRollsLeft === 0 ||
                this.getRollsLeft === 3
            )
                return true;
            else return false;
        },
        ahTwoSlot() {
            return !this.ahOneSlot;
        },
        activeItem() {
            return this.$store.state.activeItem;
        },
        checkEndGame() {
            return this.$store.getters.checkEndGame;
        },
        rollingInProgress() {
            return this.$store.state.rollingInProgress;
        },
        animation() {
            return this.$store.state.animation;
        },
        classObject() {
            if (this.ahOneSlot && !this.activeItemExists && this.getRollsLeft === 0) {
                return "info";
            } else if (
                this.ahOneSlot &&
                this.animation === false
            ) {
                return "info blink-infinite pointer"
            } else if (
                this.ahOneSlot &&
                this.animation === true
            ) {
                return "info blink-infinite-two pointer"
            } else if (
                this.ahOneSlot &&
                this.rollingInProgress
            ) {
                return "info"
            } else return ""
        }
    },

    methods: {
        rollDice() {
            store.dispatch("rollDice");
        },
        nextRound() {
            this.$store.dispatch("nextRound");
        }
    },
    template: `<div v-bind:class="{'ah-one-slot black-border' : ahOneSlot, 'action-holder' : ahTwoSlot}"> 
            <div v-if="!activeItemExists && getRollsLeft===0" v-bind:class="classObject">Lås kombination innan vi fortsätter.</div>
            <div v-else-if="ahOneSlot && getRollsLeft===3" v-bind:class="classObject" v-on:click="rollDice">Rulla tärningar, ({{getRollsLeft}} kast kvar)</div>
            <div v-else-if="ahOneSlot && getRollsLeft>0 && rollingInProgress" v-bind:class="classObject" v-on:click="rollDice">Rulla tärningarna igen eller lås, ({{getRollsLeft}} kast kvar)</div>
            <div v-else-if="ahOneSlot && getRollsLeft>0" v-bind:class="classObject" v-on:click="rollDice">Rulla tärningarna igen eller lås, ({{getRollsLeft}} kast kvar</div>
            <div v-else-if="getRollsLeft===0 && activeItemExists" v-bind:class="classObject" v-on:click="nextRound">Lås kombination</div>
            <div v-if="activeItemExists && getRollsLeft!=0 && animation === false" class="roll blink-infinite pointer" v-on:click="rollDice">Rulla tärningarna, ({{getRollsLeft}} kast kvar)</div>
            <div v-else-if="activeItemExists && getRollsLeft!=0 && animation === true" class="roll blink-infinite-two pointer" v-on:click="rollDice">Rulla tärningarna, ({{getRollsLeft}} kast kvar)</div>
            <div v-if="getRollsLeft!=3 && getRollsLeft!=0 && activeItemExists && animation === false" class="next blink-infinite pointer" v-on:click="nextRound">Lås kombination</div>
            <div v-if="getRollsLeft!=3 && getRollsLeft!=0 && activeItemExists && animation === true" class="next blink-infinite-two pointer" v-on:click="nextRound">Lås kombination</div>
               
   </div>`
};
const RulesMobile = {
    template: ` <div>
  <div class="rule-nav">
  <p>
  <router-link to="/rules">Hur man spelar</router-link> |
  <router-link to="/">Till Spelet</router-link>
  </p>
  </div>
  
  <sidebar-holder></sidebar-holder>
  </div>
  `,

    components: {
        "sidebar-holder": Sidebar
    }
};
const Container = {
    computed: {
        isMobile() {
            return this.$store.state.isMobile;
        },
        victoryScreen() {
            return this.$store.state.victoryScreen;
        },
    },
    methods: {},
    template: `
  <div>
  <transition name="fade">
  <section v-if="!victoryScreen" class="container">
  <header-holder v-if="!isMobile && !victoryScreen">Yatzy, Totals. </header-holder>
                <header-holder-mobile v-else-if="isMobile && !victoryScreen">Yatzy, Totals. </header-holder-mobile>
                <sidebar-holder v-if="!isMobile && !victoryScreen"></sidebar-holder>
                <score-card v-if="!victoryScreen">Score Card</score-card>
                <dice-holder v-if="!victoryScreen">"Dice Holder</dice-holder>
                <action-holder v-if="!victoryScreen">Action Holder</action-holder>
                </section>
                </transition>
                <transition name="fade">
  <victory-holder v-if="victoryScreen" class="victory-container">></victory-holder>
  </transition>
               
                </div>
  `,
    components: {
        "dice-holder": DiceHolder,
        "action-holder": Actions,
        "header-holder": Header,
        "header-holder-mobile": HeaderMobile,
        "sidebar-holder": Sidebar,
        "rules-mobile": RulesMobile,
        "victory-holder": Victory
    }
};

const routes = [
    { path: "/rules", component: RulesMobile },
    { path: "/", component: Container }
];

const router = new VueRouter({
    routes
});


const app = new Vue({
    store: store,
    el: "#app",
    router,
    computed: {
        activeItemExists() {
            return this.$store.getters.activeItemExists;
        },



        nextRound() {
            this.$store.dispatch("nextRound");
        }
    },
    mounted() {
        this.$store.commit("initDice");
        this.$store.commit("initScoreCard");
        this.startKeyEventListener();
    },
    components: {
        "container-holder": Container,
        "victory-holder": Victory
    }
});