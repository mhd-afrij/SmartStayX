const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  status: user.status,
  image: user.image || "",
});

export const me = async (req, res) => {
  return res.json({ success: true, user: publicUser(req.user) });
};
