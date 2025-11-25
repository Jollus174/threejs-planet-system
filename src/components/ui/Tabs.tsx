import React, { useState } from 'react';
import type { BodyData } from '../../types';
import {
	distanceConverter,
	timeConversion,
	valueToFixedFloatingPoints,
	getNamePeriapsis,
	getNameApoapsis
} from '../../modules/utilities/formatting';

interface TabsProps {
	clickedClassData: BodyData;
}

const Tabs: React.FC<TabsProps> = ({ clickedClassData }) => {
	const [tabGroup, setTabGroup] = useState('tab-stats');
	const namePeriapsis = getNamePeriapsis(clickedClassData);
	const nameApoapsis = getNameApoapsis(clickedClassData);

	return (
		<>
			<div className="btn-group-wrapper tabs-details order-lg-3">
				<nav className="btn-group" role="group">
					<div className="input-group">
						<input
							type="radio"
							className="btn-check"
							name="tab-group"
							id="tab-desc"
							value="tab-desc"
							checked={tabGroup === 'tab-desc'}
							onChange={() => setTabGroup('tab-desc')}
						/>
						<label className="btn" htmlFor="tab-desc">
							<span className="fab fa-wikipedia-w"></span>Desc
						</label>
					</div>
					<div className="input-group">
						<input
							type="radio"
							className="btn-check"
							name="tab-group"
							id="tab-stats"
							value="tab-stats"
							checked={tabGroup === 'tab-stats'}
							onChange={() => setTabGroup('tab-stats')}
						/>
						<label className="btn" htmlFor="tab-stats">
							<span className="fas fa-table"></span>Stats
						</label>
					</div>
					<div className="input-group">
						<input
							type="radio"
							className="btn-check"
							name="tab-group"
							id="tab-media"
							value="tab-media"
							checked={tabGroup === 'tab-media'}
							onChange={() => setTabGroup('tab-media')}
						/>
						<label className="btn" htmlFor="tab-media">
							<span className="fas fa-images"></span>Media
						</label>
					</div>
				</nav>
			</div>
			<div className="content-container order-lg-4">
				{tabGroup === 'tab-desc' && (
					<section className="content content-desc">
						<div className="content-wrapper container-fluid container-extra-gutter">
							{clickedClassData.description.content ? (
								<div
									dangerouslySetInnerHTML={{
										__html: clickedClassData.description.content
									}}
								></div>
							) : (
								<div>Loading description...</div>
							)}
						</div>
					</section>
				)}
				{tabGroup === 'tab-stats' && (
					<section className="content content-stats">
						<div className="content-wrapper container-fluid container-extra-gutter">
							<table>
								<tbody>
									{clickedClassData.discoveredBy ? (
										<tr>
											<td>Discovered By</td>
											<td>{clickedClassData.discoveredBy}</td>
										</tr>
									) : null}
									{clickedClassData.discoveryDate ? (
										<tr>
											<td>Discovery Date</td>
											<td>{clickedClassData.discoveryDate}</td>
										</tr>
									) : null}
									{clickedClassData.moons &&
									Array.isArray(clickedClassData.moons) &&
									clickedClassData.moons.length > 0 ? (
										<tr>
											<td>Moons</td>
											<td>{clickedClassData.moons.length}</td>
										</tr>
									) : null}
									{clickedClassData.avgTemp !== undefined ? (
										<tr>
											<td>Surface Temp</td>
											<td className="text-nowrap">{clickedClassData.avgTemp} °C</td>
										</tr>
									) : null}
									{clickedClassData.mass &&
									clickedClassData.mass.massValue &&
									clickedClassData.mass.massExponent !== undefined ? (
										<tr>
											<td>Mass</td>
											<td className="text-nowrap">
												{valueToFixedFloatingPoints(clickedClassData.mass.massValue)} x 10
												<sup>{clickedClassData.mass.massExponent}</sup> <sub>kg</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.semimajorAxis ? (
										<tr>
											<td>Semi-Major Axis</td>
											<td className="text-nowrap">
												{distanceConverter(clickedClassData.semimajorAxis).value}{' '}
												<sub>{distanceConverter(clickedClassData.semimajorAxis).unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.perihelion ? (
										<tr>
											<td>{namePeriapsis}</td>
											<td className="text-nowrap">
												{distanceConverter(clickedClassData.perihelion).value}{' '}
												<sub>{distanceConverter(clickedClassData.perihelion).unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.aphelion ? (
										<tr>
											<td>{nameApoapsis}</td>
											<td className="text-nowrap">
												{distanceConverter(clickedClassData.aphelion).value}{' '}
												<sub>{distanceConverter(clickedClassData.aphelion).unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.eccentricity !== undefined ? (
										<tr>
											<td>Eccentricity</td>
											<td className="text-nowrap">{clickedClassData.eccentricity}</td>
										</tr>
									) : null}
									{clickedClassData.inclination !== undefined ? (
										<tr>
											<td>Inclination</td>
											<td className="text-nowrap">{clickedClassData.inclination} °</td>
										</tr>
									) : null}
									{clickedClassData.diameter ? (
										<tr>
											<td>Mean Diameter</td>
											<td className="text-nowrap">
												{distanceConverter(clickedClassData.diameter).value}{' '}
												<sub>{distanceConverter(clickedClassData.diameter).unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.meanRadius ? (
										<tr>
											<td>Mean Radius</td>
											<td className="text-nowrap">
												{distanceConverter(clickedClassData.meanRadius).value}{' '}
												<sub>{distanceConverter(clickedClassData.meanRadius).unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.equaRadius ? (
										<tr>
											<td>Equatorial Radius</td>
											<td className="text-nowrap">
												{distanceConverter(clickedClassData.equaRadius).value}{' '}
												<sub>{distanceConverter(clickedClassData.equaRadius).unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.polarRadius ? (
										<tr>
											<td>Polar Radius</td>
											<td className="text-nowrap">
												{distanceConverter(clickedClassData.polarRadius).value}{' '}
												<sub>{distanceConverter(clickedClassData.polarRadius).unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.axialTilt !== undefined ? (
										<tr>
											<td>Axial Tilt</td>
											<td className="text-nowrap">{valueToFixedFloatingPoints(clickedClassData.axialTilt)} °</td>
										</tr>
									) : null}
									{clickedClassData.sideralOrbit ? (
										<tr>
											<td>Sideral Orbit</td>
											<td className="text-nowrap">
												{timeConversion(clickedClassData.sideralOrbit, 'days').value}{' '}
												<sub>{timeConversion(clickedClassData.sideralOrbit, 'days').unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.sideralRotation ? (
										<tr>
											<td>Sideral Rotation</td>
											<td className="text-nowrap">
												{timeConversion(clickedClassData.sideralRotation, 'hours').value}{' '}
												<sub>{timeConversion(clickedClassData.sideralRotation, 'hours').unit}</sub>
											</td>
										</tr>
									) : null}
									{clickedClassData.meanAnomaly !== undefined ? (
										<tr>
											<td>Mean Anomaly</td>
											<td className="text-nowrap">{valueToFixedFloatingPoints(clickedClassData.meanAnomaly)} °</td>
										</tr>
									) : null}
									{clickedClassData.argPeriapsis !== undefined ? (
										<tr>
											<td>Argument of {namePeriapsis}</td>
											<td className="text-nowrap">{valueToFixedFloatingPoints(clickedClassData.argPeriapsis)} °</td>
										</tr>
									) : null}
									{clickedClassData.longAscNode !== undefined ? (
										<tr>
											<td>Longitude of Ascending Node</td>
											<td className="text-nowrap">{valueToFixedFloatingPoints(clickedClassData.longAscNode)} °</td>
										</tr>
									) : null}
									{clickedClassData.longOfPeriapsis !== undefined && clickedClassData.longOfPeriapsis < 360 ? (
										<tr>
											<td>Longitude of {namePeriapsis}</td>
											<td className="text-nowrap">{valueToFixedFloatingPoints(clickedClassData.longOfPeriapsis)} °</td>
										</tr>
									) : null}
								</tbody>
							</table>
						</div>
					</section>
				)}
				{tabGroup === 'tab-media' && (
					<section className="content content-media">
						<div className="content-wrapper container-fluid container-extra-gutter text-center">
							{clickedClassData.media.items.length > 0 ? (
								<div className="row">
									{clickedClassData.media.items.map((item, i) => (
										<div key={i} className="col-media col-6">
											<figure>
												<a className="media" href="#" onClick={(e) => e.preventDefault()}>
													<img src={item.thumb} width="100%" alt="" />
													<div className="overlay">{item.title}</div>
												</a>
											</figure>
										</div>
									))}
								</div>
							) : (
								<div>No media available</div>
							)}
						</div>
					</section>
				)}
			</div>
		</>
	);
};

export default Tabs;
