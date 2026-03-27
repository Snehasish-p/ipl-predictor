import { useEffect, useState } from "react";

export default function PointsTable() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users with points from backend
    fetch("http://localhost:3001/api/users", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // if you store JWT in localStorage
      },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Failed to fetch users:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏆 Leaderboard</h2>
      <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "center" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={u.id}>
              <td>{index + 1}</td>
              <td>{u.name}</td>
              <td>{u.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}