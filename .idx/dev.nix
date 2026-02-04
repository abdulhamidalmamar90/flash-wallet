{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.firebase-tools
    pkgs.git
  ];
  env = {
    FIREBASE_PROJECT_ID = "flashwallet";
  };
  idx = {
    extensions = [
      "dsznajder.es7-react-js-snippets"
      "bradlc.vscode-tailwindcss"
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {
        # يتم تشغيل هذا الأمر عند بدء تشغيل بيئة العمل
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = [
            "npm"
            "run"
            "dev"
            "--"
            "--port"
            "$PORT"
            "--hostname"
            "0.0.0.0"
          ];
          manager = "web";
        };
      };
    };
  };
}
