import React, { useState } from 'react';
import { useOrrery } from '../../contexts/OrreryContext';
import { add, format, differenceInHours } from 'date-fns';

const TimeControls: React.FC = () => {
	const { setDateTimeDifference } = useOrrery();
	const [timeShiftTypes, setTimeShiftTypes] = useState({
		hours: 0,
		days: 0,
		months: 0
	});
	const [timeShiftTypeCurrentIndex, setTimeShiftTypeCurrentIndex] = useState(0);
	const [timeShiftSystemOnly, setTimeShiftSystemOnly] = useState(false);
	const [dateTimeCurrent] = useState(new Date());

	const currentTimeShiftType = () => {
		const i = Math.abs(timeShiftTypeCurrentIndex);
		if (i === 1) return 'hours';
		else if (i === 2) return 'days';
		else if (i === 3) return 'months';
		else return '';
	};

	const dateTimeShifted = add(new Date(), { ...timeShiftTypes });
	const dateTimeDifference = differenceInHours(dateTimeShifted, new Date()) / 24;

	React.useEffect(() => {
		setDateTimeDifference(dateTimeDifference);
	}, [dateTimeDifference, setDateTimeDifference]);

	const dateTimeText = () => {
		const days = format(dateTimeShifted, 'dd');
		const months = format(dateTimeShifted, 'MMM');
		const years = format(dateTimeShifted, 'yyyy');
		return `<time class="days">${days}</time> / <time class="months">${months}</time> / <time class="years">${years}</time>`;
	};

	const timeShiftForwards = () => {
		if (timeShiftTypeCurrentIndex < 3) {
			setTimeShiftTypeCurrentIndex(timeShiftTypeCurrentIndex + 1);
		}
	};

	const timeShiftBackwards = () => {
		if (-3 < timeShiftTypeCurrentIndex) {
			setTimeShiftTypeCurrentIndex(timeShiftTypeCurrentIndex - 1);
		}
	};

	const timeShiftStop = () => {
		setTimeShiftTypeCurrentIndex(0);
	};

	const timeShiftReset = () => {
		setTimeShiftTypes({ hours: 0, days: 0, months: 0 });
		setTimeShiftTypeCurrentIndex(0);
	};

	return (
		<div className="time-container">
			<button
				type="button"
				className="btn btn-rounded"
				title="Shift Time Backwards"
				disabled={timeShiftTypeCurrentIndex === -4}
				onClick={timeShiftBackwards}
			>
				<i className="fas fa-backward"></i>
				{timeShiftTypeCurrentIndex < 0 && <span className="badge">{Math.abs(timeShiftTypeCurrentIndex)}</span>}
			</button>
			<button
				type="button"
				className="btn btn-rounded"
				title="Stop Time"
				disabled={timeShiftTypeCurrentIndex === 0}
				onClick={timeShiftStop}
			>
				<i className="fas fa-stop"></i>
			</button>
			<button
				type="button"
				className="btn btn-rounded"
				title="Shift Time Forwards"
				disabled={timeShiftTypeCurrentIndex === 4}
				onClick={timeShiftForwards}
			>
				<i className="fas fa-forward"></i>
				{timeShiftTypeCurrentIndex > 0 && <span className="badge">{timeShiftTypeCurrentIndex}</span>}
			</button>
			<button type="button" className="btn btn-rounded" title="Reset Time" onClick={timeShiftReset}>
				<i className="fas fa-redo-alt"></i>
			</button>
			<button
				type="button"
				className={`btn btn-rounded ${timeShiftSystemOnly ? 'active' : ''}`}
				title="Lock Planets"
				onClick={() => setTimeShiftSystemOnly(!timeShiftSystemOnly)}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{ width: '18px', marginTop: '-4px' }}>
					<ellipse style={{ fill: 'none', strokeWidth: '27px' }} cx="255.372" cy="253.904" rx="238.5" ry="238.5" />
					<path
						d="M 507.372 253.904 C 507.372 322.522 478.424 387.234 433.563 432.095 C 388.702 476.956 323.99 505.904 255.372 505.904 C 186.754 505.904 122.042 476.956 77.181 432.095 C 32.32 387.234 3.372 322.522 3.372 253.904 C 3.372 207.986 16.335 163.817 38.355 126.175 C 44.216 133.035 51.166 138.935 58.939 143.607 C 40.56 175.993 30.372 213.164 30.372 253.904 C 30.372 317.006 54.814 371.544 96.273 413.003 C 137.732 454.462 192.27 478.904 255.372 478.904 C 318.474 478.904 373.012 454.462 414.471 413.003 C 455.93 371.544 480.372 317.006 480.372 253.904 C 480.372 190.802 455.93 136.264 414.471 94.805 C 373.012 53.346 318.474 28.904 255.372 28.904 C 228.559 28.904 203.293 33.317 179.919 41.573 C 176.62 33.097 171.98 25.292 166.258 18.418 C 194.186 7.809 224.381 1.904 255.372 1.904 C 323.99 1.904 388.702 30.852 433.563 75.713 C 478.424 120.574 507.372 185.286 507.372 253.904 Z"
						style={{ fill: 'currentColor' }}
					/>
					<ellipse style={{ fill: 'currentColor' }} cx="250.399" cy="250.133" rx="121.032" ry="121.032" />
					<ellipse style={{ fill: 'currentColor' }} cx="101.226" cy="71.152" rx="52.814" ry="52.814" />
				</svg>
			</button>
			<span className="date-time" dangerouslySetInnerHTML={{ __html: dateTimeText() }}></span>
		</div>
	);
};

export default TimeControls;
