# animcs-compiler

将 `site/content/anims/*.cs` 的 C# 动画脚本编译为浏览器可执行的 JS 模块。

目标：前端只运行 JS，不加载 WASM / dotnet runtime。

- 编译器只支持 **受限的 C# 子集**，详见 `SupportedFeatures.md`。
- 如果脚本使用了不支持的语法，编译会失败并给出错误提示。

构建流程由 `site/tooling/scripts/build-animcs.js` 调用。
