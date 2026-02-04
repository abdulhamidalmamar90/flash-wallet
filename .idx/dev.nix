{pkgs}: {
  channel = "stable-24.11";
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
    pkgs.android-sdk # إضافة الـ SDK
    pkgs.gradle      # إضافة محرك البناء
  ];
  env = {
    # تعريف المسارات للنظام بشكل آلي
    ANDROID_SDK_ROOT = "/home/user/Android/Sdk";
    ANDROID_HOME = "/home/user/Android/Sdk";
  };
  idx = {
    extensions = [];
    workspace = {
      onCreate = {
        default.openFiles = ["src/app/page.tsx"];
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}