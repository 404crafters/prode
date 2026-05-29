export type AppUserRole = "user" | "admin";

export type AppUser = {
  username: string;
  password: string;
  displayName: string;
  role: AppUserRole;
  active?: boolean;
};

export const users: AppUser[] = [
  {
    username: "admin",
    password: "admin",
    displayName: "Admin",
    role: "admin",
    active: true,
  },
  {
    username: "demo",
    password: "demo",
    displayName: "Demo",
    role: "user",
    active: true,
  },
];

export function findUser(username: string): AppUser | undefined {
  return users.find((user) => user.username === username && user.active !== false);
}
