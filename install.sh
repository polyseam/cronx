#!/bin/sh

set -e

main() {
    cronx_install="${CRONX_INSTALL:-$HOME/.cronx}"
    bin_dir="$cronx_install/bin"
    bin_suffix=""

    if [ "$OS" = "Windows_NT" ]; then # WSL or Git Bash or Cygwin
        bin_suffix=".exe"
        target="win-amd64"
    else
        case $(uname -sm) in
            "Darwin x86_64") target="mac-amd64" ;;
            "Darwin arm64") target="mac-arm64" ;;
            "Linux aarch64")
                target="linux-arm64"
            ;;
            "Linux x86_64")
                target="linux-amd64"
            ;;
            *)
                target="linux-amd64"
        esac
    fi

    if ! command -v unzip >/dev/null; then
        echo "Error: unzip is required to install and upgrade cronx!" 1>&2
        exit 1
    fi
        
    cronx_uri="https://github.com/polyseam/cronx/releases/latest/download/cronx-${target}.tar.gz"
    
    exe="$bin_dir/cronx"
    
    if [ ! -d "$bin_dir" ]; then
        mkdir -p "$bin_dir"
    fi
    
    curl --fail --location --progress-bar --output "$exe.tar.gz" "$cronx_uri"
    tar -xzf "$exe.tar.gz" -C "$bin_dir"
    
    chmod +x "$exe"
    
    rm "$exe.tar.gz"
    
    echo "cronx was downloaded successfully to $exe"
    
    # set shell profile for user shell
    case "$SHELL" in
        /bin/zsh) shell_profile=".zshrc" ;;
        *) shell_profile=".profile" ;;
    esac
    
    # if $cronx_install is not in $PATH
    if ! command -v cronx >/dev/null; then
        # if $cronx_install is not in $shell_profile

        if ! grep -q "$bin_dir" "$HOME/$shell_profile"; then
            echo "adding $bin_dir to \$PATH"
            command printf '\nexport PATH="%s:$PATH"' "$bin_dir" >>"$HOME/$shell_profile"
        fi
    fi
    
    # if $shell_profile is .zshrc exit because sourcing it will cause an error
    if [ "$shell_profile" = ".zshrc" ]; then
        echo "finalizing installation..."
        # running 'cronx --help' will save the user wait time on first run
        $exe --help --welcome
        echo
        echo "cronx was installed successfully! Please restart your terminal."
        echo "Need some help? Join our Discord https://cndi.run/di?utm_id=5119"
        echo
        exit 0
    fi
    
    # source $shell_profile
    if [ -f "$HOME/$shell_profile" ]; then
        echo "sourcing $HOME/$shell_profile"
        . "$HOME/$shell_profile"
        echo "finalizing installation..."
        # running 'cronx --help' will save the user wait time on first run
        $exe --help --welcome
        echo
        echo "cronx was installed successfully! Please restart your terminal."
        echo "Need some help? Join our Discord https://cndi.run/di?utm_id=5119"
        echo
        exit 0
    fi
}

main "$@"
