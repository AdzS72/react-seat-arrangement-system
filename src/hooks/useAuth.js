import { jwtDecode } from "jwt-decode";

export const useAuth = () => {
	const token = localStorage.getItem("token");
	let isViewer = false;
	let isAdmin = false;

	if (token) {
		const decoded = jwtDecode(token);
		const { id, username, role } = decoded;

		isAdmin = role == 1;
		isViewer = role == 2;

		return {
			id,
			username,
			role,
			isViewer,
			isAdmin,
		};
	}

	return {
		username: "",
		role: [],
		isViewer,
		isAdmin,
	};
};
