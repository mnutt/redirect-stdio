#include <assert.h>
#include <node_api.h>
#include <fcntl.h> // For file control options
#include <unistd.h> // For dup2, close
#include <limits.h>
#include <stdlib.h>
#include <string.h>

#ifdef __linux__
#include <stdio.h>
int getFilePath(int fd, char *path, size_t size) {
    char linkpath[PATH_MAX]; 
    snprintf(linkpath, sizeof(linkpath), "/proc/self/fd/%d", fd);
    ssize_t len = readlink(linkpath, path, size);
    if (len == -1) {
        return -1;
    }
    path[len] = '\0';
    return 0;
}

#elif defined(__APPLE__)
int getFilePath(int fd, char *path, size_t size) {
    if (fcntl(fd, F_GETPATH, path) == -1) {
        return -1;
    }
    return 0;
}

#else
#error "Only linux and macos are supported"
#endif

static napi_value RedirectFd(napi_env env, napi_callback_info info) {
    napi_status status;

    size_t argc = 2;
    napi_value args[2];
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    assert(status == napi_ok);

    if (argc < 2) {
        napi_throw_error(env, NULL, "Wrong number of arguments");
        return NULL;
    }

    napi_valuetype valuetype0;
    status = napi_typeof(env, args[0], &valuetype0);
    if (status != napi_ok || valuetype0 != napi_number) {
        napi_throw_type_error(env, NULL, "Expected the first argument to be a number");
        return NULL;
    }

    int sourceFd;
    status = napi_get_value_int32(env, args[0], &sourceFd); // Get the source file descriptor
    assert(status == napi_ok);

    napi_valuetype valuetype1;
    status = napi_typeof(env, args[1], &valuetype1);
    if (status != napi_ok || valuetype1 != napi_string) {
        napi_throw_type_error(env, NULL, "Expected the second argument to be a string");
        return NULL;
    }

    char filePath[1024];
    size_t strLen;
    status = napi_get_value_string_utf8(env, args[1], filePath, 1024, &strLen); // Get the target file path
    assert(status == napi_ok);

    int targetFd = open(filePath, O_WRONLY | O_CREAT | O_APPEND, 0666);
    if (targetFd == -1) {
        napi_throw_error(env, NULL, "Failed to create file");
        return NULL;
    }

    // duplicate targetFd onto the original file descriptor to replace it
    if (dup2(targetFd, sourceFd) == -1) {
        napi_throw_error(env, NULL, "dup2 syscall failed");
        return NULL;
    }

    // targetFd is now a duplicate and can be closed
    close(targetFd);

    return NULL;
}

static napi_value PathFromFd(napi_env env, napi_callback_info info) {
    napi_status status;

    size_t argc = 1;
    napi_value args[1];
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    assert(status == napi_ok);

    if (argc < 1) {
        napi_throw_error(env, NULL, "Wrong number of arguments");
        return NULL;
    }

    napi_valuetype valuetype0;
    status = napi_typeof(env, args[0], &valuetype0);
    if (status != napi_ok || valuetype0 != napi_number) {
        napi_throw_type_error(env, NULL, "Expected the first argument to be a number");
        return NULL;
    }

    int fd;
    status = napi_get_value_int32(env, args[0], &fd);
    assert(status == napi_ok);

    char filePath[1024];
    if (getFilePath(fd, filePath, sizeof(filePath) - 1) == -1) {
        napi_throw_error(env, NULL, "Could not get path from fd");
        return NULL;
    }

    napi_value path;
    status = napi_create_string_utf8(env, filePath, strlen(filePath), &path);
    assert(status == napi_ok);

    return path;
}

#define DECLARE_NAPI_METHOD(name, func) { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value Init(napi_env env, napi_value exports) {
    napi_status status;

    napi_property_descriptor descriptors[] = {
      DECLARE_NAPI_METHOD("redirectFd", RedirectFd),
      DECLARE_NAPI_METHOD("pathFromFd", PathFromFd),
    };

    status = napi_define_properties(env, exports, sizeof(descriptors) / sizeof(descriptors[0]), descriptors);
    assert(status == napi_ok);

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
