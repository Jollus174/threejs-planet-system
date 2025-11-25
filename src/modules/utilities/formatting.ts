import { kmToAU } from './astronomy';
import type { BodyData } from '../../types';

/**
 * Formats a number with commas (e.g., 1000000 -> "1,000,000")
 */
export const valueWithCommas = (value: number | undefined | null): string => {
	if (value === undefined || value === null) return '';
	return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Formats a number to a fixed number of decimal places, removing trailing zeros
 */
export const valueToFixedFloatingPoints = (value: number | undefined | null, amountPoints: number = 2): number => {
	if (value === undefined || value === null) return 0;
	const distanceNumber = value.toFixed(amountPoints).split('.');
	const floatingPoints = distanceNumber[1].toString() !== '00' ? '.' + distanceNumber[1] : '';
	return parseFloat(distanceNumber[0] + floatingPoints);
};

/**
 * Converts distance from km to appropriate unit (km or AU)
 * Returns formatted value with unit
 */
export const distanceConverter = (value: number | undefined | null): { value: string; unit: string } => {
	if (!value) {
		return { value: '', unit: '' };
	}
	// convert from km to AU if distance more than 0.66 AU
	const kmToAUThreshold = 149598000;
	const isClose = value < kmToAUThreshold / 2;

	const convertedValue = isClose ? value : kmToAU(value);
	const formattedValue = valueWithCommas(valueToFixedFloatingPoints(convertedValue));

	return {
		value: formattedValue,
		unit: isClose ? 'km' : 'AU'
	};
};

/**
 * Converts time from hours or days to appropriate unit (hours, days, or years)
 * Returns formatted value with unit
 */
export const timeConversion = (
	value: number | undefined | null,
	unit: 'hours' | 'days'
): { value: string; unit: string } => {
	if (!value || !unit) {
		return { value: '', unit: '' };
	}

	if (unit === 'hours') {
		const convertedHours = value;
		const convertedDays = value / 24;
		const convertedYears = value / 365.256 / 24;
		if (value < 48) {
			const hours = valueToFixedFloatingPoints(convertedHours);
			return {
				value: valueWithCommas(hours),
				unit: `Earth ${pluralise('hour', hours)}`
			};
		}
		// 320 days
		if (value < 7680) {
			const days = valueToFixedFloatingPoints(convertedDays);
			return {
				value: valueWithCommas(days),
				unit: `Earth ${pluralise('day', days)}`
			};
		}
		const years = valueToFixedFloatingPoints(convertedYears);
		return {
			value: valueWithCommas(years),
			unit: `Earth ${pluralise('year', years)}`
		};
	}

	if (unit === 'days') {
		const convertedHours = value * 24;
		const convertedDays = value;
		const convertedYears = value / 365.256;
		if (value < 2) {
			const hours = valueToFixedFloatingPoints(convertedHours);
			return {
				value: valueWithCommas(hours),
				unit: `Earth ${pluralise('hour', hours)}`
			};
		}
		if (value < 320) {
			const days = valueToFixedFloatingPoints(convertedDays);
			return {
				value: valueWithCommas(days),
				unit: `Earth ${pluralise('day', days)}`
			};
		}
		const years = valueToFixedFloatingPoints(convertedYears);
		return {
			value: valueWithCommas(years),
			unit: `Earth ${pluralise('year', years)}`
		};
	}

	return { value: '', unit: '' };
};

/**
 * Pluralises a word based on the value
 */
export const pluralise = (word: string, value: number): string => {
	if (!word || value === undefined || value === null) {
		return '';
	}
	return `${word}${value !== 1 ? 's' : ''}`;
};

/**
 * Gets the appropriate name for periapsis based on the body's orbit
 */
export const getNamePeriapsis = (data: BodyData | null): string => {
	if (!data) return '';
	if (data.aroundPlanet && data.aroundPlanet.planet === 'earth') return 'Perigee';
	return data.aroundPlanet ? 'Periapsis' : 'Perihelion';
};

/**
 * Gets the appropriate name for apoapsis based on the body's orbit
 */
export const getNameApoapsis = (data: BodyData | null): string => {
	if (!data) return '';
	if (data.aroundPlanet && data.aroundPlanet.planet === 'earth') return 'Apogee';
	return data.aroundPlanet ? 'Apoapsis' : 'Aphelion';
};
