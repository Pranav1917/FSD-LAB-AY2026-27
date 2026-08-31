import React, { useState, useEffect } from "react";

function App() {
  const [project, setProject] = useState("");
  const [tool, setTool] = useState("");
  const [employee, setEmployee] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("Scheduled");

  const [resources, setResources] = useState(() => {
    const savedResources = localStorage.getItem(
      "softwareResources"
    );

    return savedResources
      ? JSON.parse(savedResources)
      : [];
  });

  useEffect(() => {
    localStorage.setItem(
      "softwareResources",
      JSON.stringify(resources)
    );
  }, [resources]);

  const allocateResource = () => {
    if (
      project.trim() === "" ||
      tool.trim() === "" ||
      employee.trim() === "" ||
      date === "" ||
      startTime === "" ||
      endTime === ""
    ) {
      return;
    }

    const newResource = {
      project,
      tool,
      employee,
      date,
      startTime,
      endTime,
      status,
    };

    setResources([...resources, newResource]);

    setProject("");
    setTool("");
    setEmployee("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setStatus("Scheduled");
  };

  const deleteResource = (index) => {
    const updatedResources = resources.filter(
      (_, i) => i !== index
    );

    setResources(updatedResources);
  };

  return (
    <div className="app">
      <h1>Software Resource Allocation</h1>

      <div className="input-container">
        <input
          type="text"
          placeholder="Project Name"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        />

        <input
          type="text"
          placeholder="Software Tool / Resource"
          value={tool}
          onChange={(e) => setTool(e.target.value)}
        />

        <input
          type="text"
          placeholder="Assigned Employee"
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>Scheduled</option>
          <option>In Use</option>
          <option>Completed</option>
        </select>

        <button onClick={allocateResource}>
          Allocate Resource
        </button>
      </div>

      <div className="task-list">
        {resources.map((item, index) => (
          <div className="task-card" key={index}>
            <div>
              <h3>{item.project}</h3>

              <p>
                Tool / Resource: {item.tool}
              </p>

              <p>
                Assigned To: {item.employee}
              </p>

              <p>
                Date: {item.date}
              </p>

              <p>
                Schedule: {item.startTime} - {item.endTime}
              </p>

              <p>
                Status: {item.status}
              </p>
            </div>

            <button
              onClick={() => deleteResource(index)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;