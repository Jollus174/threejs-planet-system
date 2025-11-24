import React, { useState } from "react";
import type { BodyData } from "../../types";

interface TabsProps {
  clickedClassData: BodyData;
}

const Tabs: React.FC<TabsProps> = ({ clickedClassData }) => {
  const [tabGroup, setTabGroup] = useState("tab-stats");

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
              checked={tabGroup === "tab-desc"}
              onChange={() => setTabGroup("tab-desc")}
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
              checked={tabGroup === "tab-stats"}
              onChange={() => setTabGroup("tab-stats")}
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
              checked={tabGroup === "tab-media"}
              onChange={() => setTabGroup("tab-media")}
            />
            <label className="btn" htmlFor="tab-media">
              <span className="fas fa-images"></span>Media
            </label>
          </div>
        </nav>
      </div>
      <div className="content-container order-lg-4">
        {tabGroup === "tab-desc" && (
          <section className="content content-desc">
            <div className="content-wrapper container-fluid container-extra-gutter">
              {clickedClassData.description.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: clickedClassData.description.content,
                  }}
                ></div>
              ) : (
                <div>Loading description...</div>
              )}
            </div>
          </section>
        )}
        {tabGroup === "tab-stats" && (
          <section className="content content-stats">
            <div className="content-wrapper container-fluid container-extra-gutter">
              <table>
                <tbody>
                  {clickedClassData.meanRadius && (
                    <tr>
                      <td>Mean Radius</td>
                      <td>{clickedClassData.meanRadius} km</td>
                    </tr>
                  )}
                  {clickedClassData.sideralOrbit && (
                    <tr>
                      <td>Sideral Orbit</td>
                      <td>{clickedClassData.sideralOrbit} days</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tabGroup === "tab-media" && (
          <section className="content content-media">
            <div className="content-wrapper container-fluid container-extra-gutter text-center">
              {clickedClassData.media.items.length > 0 ? (
                <div className="row">
                  {clickedClassData.media.items.map((item, i) => (
                    <div key={i} className="col-media col-6">
                      <figure>
                        <a
                          className="media"
                          href="#"
                          onClick={(e) => e.preventDefault()}
                        >
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
