import React, { useState } from 'react';
import { useOrrery } from '../../contexts/OrreryContext';
import Tabs from './Tabs';

const Sidebar: React.FC = () => {
	const { mouseState } = useOrrery();
	const [sidebarMobileHeight, setSidebarMobileHeight] = useState(400);
	const [sidebarDesktopWidth, setSidebarDesktopWidth] = useState(600);
	const [vueRandomString] = useState(() => Math.random().toString(36).substring(2, 10));

	const clickedClassData = mouseState._clickedClass?.data;

	return (
		<aside id="sidebar-ui-details" className="sidebar-ui-details" key={vueRandomString}>
			<button
				id="btn-mobile-drag-bar"
				className="btn btn-mobile-drag-bar d-lg-none"
				onPointerDown={(e) => {
					// TODO: Implement resize handler
				}}
			>
				<i className="fas fa-grip-lines"></i>
			</button>
			<button
				id="btn-desktop-drag-bar"
				className="btn btn-desktop-drag-bar d-none d-lg-flex"
				onPointerDown={(e) => {
					// TODO: Implement resize handler
				}}
			>
				<i className="fas fa-grip-lines-vertical"></i>
			</button>
			<div className="ui-details">
				{clickedClassData && (
					<>
						<figure className="d-none d-lg-block img-container">
							{clickedClassData.sidebarImage && (
								<img src={clickedClassData.sidebarImage} alt={clickedClassData.displayName} />
							)}
						</figure>
						<div className="title-container">
							<button type="button" className="btn">
								<i className="fas fa-angle-left"></i>
							</button>
							<div className="title-wrapper">
								<h3 className="h3 text-entity-color">{clickedClassData.displayName}</h3>
								<span className="text-type">{clickedClassData.bodyType}</span>
							</div>
							<button type="button" className="btn">
								<i className="fas fa-angle-right"></i>
							</button>
						</div>
						<Tabs clickedClassData={clickedClassData} />
					</>
				)}
			</div>
		</aside>
	);
};

export default Sidebar;
