const supabase = require("../utils/createClient");

exports.example = async (req, res, next) => {
  console.log(req.body);
  const { data, error } = await supabase.from("test_table").select();
  if (error != null) {
    return res.status(500).json({
      message: "something wrong",
    });
  }
  return res.status(200).json(data);
};

exports.register = async (req, res, next) => {
    
};
