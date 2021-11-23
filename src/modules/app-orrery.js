'use strict';
// TODO: need to learn how to code-split this
// import Vue from '../node_modules/vue/dist/vue.esm.browser';

const vueOrrery = new Vue({
	el: '#app-orrery',
	data: {
		bodies: {
			_sun: {},
			_planets: [],
			_moons: [],
			_dwarfPlanets: [],
			_planetLabels: [],
			_moonLabels: [],
			_dwarfPlanetLabels: [],
			_orbitLines: [],
			_starfield: null,
			_asteroidBelt: null,
			classes: {
				_planetLabels: [],
				_moonLabels: []
			}
		}
	},
	computed: {},
	methods: {},
	mounted() {
		// TODO: this init() stuff should really run AFTER this is mounted...
	}
});

export { vueOrrery };
